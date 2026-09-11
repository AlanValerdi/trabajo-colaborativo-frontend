import { Component, input } from '@angular/core';
import { ReportStatus } from '../data/models';

const STEPS: { id: ReportStatus; label: string }[] = [
  { id: 'creado', label: 'Creado' },
  { id: 'en_revision', label: 'En revisión' },
  { id: 'resuelto', label: 'Resuelto' },
];

@Component({
  selector: 'app-report-status-timeline',
  templateUrl: './report-status-timeline.html',
  styleUrl: './report-status-timeline.css',
})
export class ReportStatusTimeline {
  readonly status = input.required<ReportStatus>();
  protected readonly steps = STEPS;

  protected reached(step: ReportStatus): boolean {
    const order = this.steps.map((item) => item.id);
    return order.indexOf(this.status()) >= order.indexOf(step);
  }
}
