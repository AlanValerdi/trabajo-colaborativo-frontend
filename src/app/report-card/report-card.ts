import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiReport } from '../data/reports-api.service';
import { statusLabel } from '../data/report-status';

@Component({
  selector: 'app-report-card',
  imports: [RouterLink],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css',
})
export class ReportCard {
  readonly report = input.required<ApiReport>();
  protected readonly statusLabel = statusLabel;

  protected locationLines(label?: string): string[] {
    if (!label) {
      return ['—'];
    }
    return label.split(' - ').map((part) => part.trim());
  }

  protected initials(name: string | undefined | null): string {
    if (!name) return '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  
}
