import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiReport } from '../data/reports-api.service';
import { ReportStatusTimeline } from '../report-status-timeline/report-status-timeline';

@Component({
  selector: 'app-report-card',
  imports: [RouterLink, ReportStatusTimeline],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css',
})
export class ReportCard {
  readonly report = input.required<ApiReport>();

  protected locationLines(label?: string): string[] {
    if (!label) {
      return ['—'];
    }
    return label.split(' - ').map((part) => part.trim());
  }
}
