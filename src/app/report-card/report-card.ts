import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReportsService } from '../data/reports.service';
import { Report } from '../data/models';
import { ReportStatusTimeline } from '../report-status-timeline/report-status-timeline';

@Component({
  selector: 'app-report-card',
  imports: [RouterLink, ReportStatusTimeline],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css',
})
export class ReportCard {
  private readonly reports = inject(ReportsService);

  readonly report = input.required<Report>();
  protected readonly item = computed(() => this.reports.viewOf(this.report()));

  protected initials(name?: string): string {
    if (!name) {
      return '?';
    }
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  protected locationLines(label?: string): string[] {
    if (!label) {
      return ['—'];
    }
    return label.split(' - ').map((part) => part.trim());
  }
}
