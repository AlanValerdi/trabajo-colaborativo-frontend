import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiReport, ReportsApiService } from '../data/reports-api.service';
import { ReportStatusTimeline } from '../report-status-timeline/report-status-timeline';

type SearchState = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

@Component({
  selector: 'app-folio-search',
  imports: [ReactiveFormsModule, ReportStatusTimeline],
  templateUrl: './folio-search.html',
  styleUrl: './folio-search.css',
})
export class FolioSearch {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReportsApiService);

  protected readonly form = this.fb.nonNullable.group({
    folio: ['', [Validators.required, Validators.pattern(/^reporte-[a-f0-9]+$/i)]],
  });

  protected readonly state = signal<SearchState>('idle');
  protected readonly result = signal<ApiReport | null>(null);

  protected search(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const folio = this.form.controls.folio.value.trim();
    this.state.set('loading');
    this.result.set(null);

    this.api.getByFolio(folio).subscribe({
      next: (report) => {
        this.result.set(report);
        this.state.set('found');
      },
      error: (err) => {
        this.state.set(err?.status === 404 ? 'not-found' : 'error');
      },
    });
  }
}
