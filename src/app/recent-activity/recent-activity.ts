import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ApiActivityEntry,
  ReportsApiService,
} from '../data/reports-api.service';
import { Spinner } from '../ui/spinner/spinner';

/**
 * HU-21 — Actividad reciente.
 * Feed global de cambios (estados, comentarios, asignaciones,
 * evidencias, colaboraciones) para mantener awareness del equipo.
 */
@Component({
  selector: 'app-recent-activity',
  imports: [DatePipe, RouterLink, Spinner],
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.css',
})
export class RecentActivity implements OnInit {
  private readonly api = inject(ReportsApiService);

  protected readonly items = signal<ApiActivityEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly expanded = signal(true);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.api.recentActivity(15).subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  protected toggle(): void {
    this.expanded.update((value) => !value);
  }

  protected typeLabel(type: string): string {
    switch (type) {
      case 'creacion':
        return 'Creación';
      case 'estado':
        return 'Estado';
      case 'asignacion':
        return 'Asignación';
      case 'comentario':
        return 'Comentario';
      case 'diagnostico':
        return 'Diagnóstico';
      case 'actividad':
        return 'Bitácora';
      case 'evidencia':
        return 'Evidencia';
      case 'colaboracion':
        return 'Colaboración';
      default:
        return 'Evento';
    }
  }

  protected formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`;
  }
}
