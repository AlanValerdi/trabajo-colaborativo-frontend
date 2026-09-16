import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiReport, ReportsApiService } from '../data/reports-api.service';
import { BreadcrumbService } from '../session/breadcrumb.service';
import { ReportStatusTimeline } from '../report-status-timeline/report-status-timeline';

@Component({
  selector: 'app-report-detail',
  imports: [RouterLink, ReportStatusTimeline],
  templateUrl: './report-detail.html',
  styleUrl: './report-detail.css',
})
export class ReportDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ReportsApiService);
  private readonly crumbs = inject(BreadcrumbService);

  protected readonly report = signal<ApiReport | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  ngOnInit(): void {
    const folio = this.route.snapshot.paramMap.get('id') ?? '';
    this.api.getByFolio(folio).subscribe({
      next: (item) => {
        this.report.set(item);
        this.crumbs.reportTitle.set(item.title);
        this.loading.set(false);
      },
      error: (err) => {
        this.notFound.set(err?.status === 404);
        this.loading.set(false);
      },
    });
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
}
