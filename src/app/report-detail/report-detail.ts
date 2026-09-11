import { Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ActivityEntry, ReportsService } from '../data/reports.service';
import { BreadcrumbService } from '../session/breadcrumb.service';
import { ReportStatusTimeline } from '../report-status-timeline/report-status-timeline';

@Component({
  selector: 'app-report-detail',
  imports: [RouterLink, ReportStatusTimeline],
  templateUrl: './report-detail.html',
  styleUrl: './report-detail.css',
})
export class ReportDetail implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly crumbs = inject(BreadcrumbService);
  protected readonly reports = inject(ReportsService);

  protected readonly report = this.reports.reportById(this.route.snapshot.paramMap.get('id') ?? '');
  protected readonly view = this.report ? this.reports.viewOf(this.report) : null;
  protected readonly workLogs = this.report
    ? this.reports.workLogs.filter((item) => item.reportId === this.report!.id)
    : [];
  protected readonly activityGroups = this.groupActivity(
    this.report ? this.reports.activityFor(this.report.id) : [],
  );

  constructor() {
    this.crumbs.reportTitle.set(this.report?.title ?? null);
  }

  ngOnDestroy(): void {
    this.crumbs.reportTitle.set(null);
  }

  protected locationLines(label?: string): string[] {
    if (!label) {
      return ['—'];
    }
    return label.split(' - ').map((part) => part.trim());
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  protected formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  private groupActivity(items: ActivityEntry[]): { label: string; items: ActivityEntry[] }[] {
    const groups = new Map<string, ActivityEntry[]>();
    for (const item of items) {
      const label = new Date(item.at)
        .toLocaleDateString('es-MX', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        })
        .toUpperCase();
      const list = groups.get(label) ?? [];
      list.push(item);
      groups.set(label, list);
    }
    return [...groups.entries()].map(([label, grouped]) => ({ label, items: grouped }));
  }
}
