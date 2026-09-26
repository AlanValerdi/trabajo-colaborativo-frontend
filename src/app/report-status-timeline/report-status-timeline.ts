import { Component, input } from '@angular/core';
import { ReportStatus } from '../data/models';
import { isExceptionStatus, MAIN_STATUS_STEPS, statusLabel } from '../data/report-status';

@Component({
  selector: 'app-report-status-timeline',
  templateUrl: './report-status-timeline.html',
  styleUrl: './report-status-timeline.css',
})
export class ReportStatusTimeline {
  readonly status = input.required<ReportStatus>();
  protected readonly steps = MAIN_STATUS_STEPS;

  protected reached(step: ReportStatus): boolean {
    if (isExceptionStatus(this.status())) {
      return false;
    }
    const order = this.steps.map((item) => item.id);
    return order.indexOf(this.status()) >= order.indexOf(step);
  }

  protected current(step: ReportStatus): boolean {
    return !isExceptionStatus(this.status()) && this.status() === step;
  }

  protected exceptionLabel(): string | null {
    return isExceptionStatus(this.status()) ? statusLabel(this.status()) : null;
  }
}
