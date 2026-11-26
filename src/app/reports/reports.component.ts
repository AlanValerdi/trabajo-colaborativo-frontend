import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { CatalogApiService, Location } from '../data/catalog-api.service';
import { ApiSpecialty, ReportsApiService } from '../data/reports-api.service';
import { IncidentCategory, Priority, ReportStatus } from '../data/models';
import { statusLabel } from '../data/report-status';
import {
  ReportsService,
  ReportsSummaryBuilding,
  ReportsSummaryCategory,
  ReportsSummaryItem,
  ReportsSummaryPriority,
  ReportsSummaryResponse,
  ReportsSummaryStatus,
} from '../services/reports.service';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'agua', label: 'Agua' },
  { value: 'ti', label: 'TI' },
  { value: 'mobiliario', label: 'Mobiliario' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'climatizacion', label: 'Climatización' },
  { value: 'otro', label: 'Otro' },
];

const STATUSES: ReportStatus[] = [
  'reportada',
  'validada',
  'asignada',
  'en_progreso',
  'en_validacion',
  'resuelta',
  'cerrada',
  'bloqueada',
  'reabierta',
];

const PRIORITIES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

const PRIORITY_LABELS: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
  'crítica': 'Crítica',
};

const CATEGORY_LABELS = new Map(CATEGORIES.map(({ value, label }) => [value, label]));

@Component({
  selector: 'app-reports',
  imports: [DatePipe, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent {
  private readonly reportsService = inject(ReportsService);
  private readonly reportsApi = inject(ReportsApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private catalogRequestsRemaining = 0;

  protected readonly result = signal<ReportsSummaryResponse | null>(null);
  protected readonly specialties = signal<ApiSpecialty[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly loading = signal(false);
  protected readonly catalogsLoading = signal(true);
  protected readonly error = signal('');
  protected readonly catalogsError = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = 20;
  protected readonly statuses = STATUSES;
  protected readonly priorities = PRIORITIES;

  protected startDate = '';
  protected endDate = '';
  protected categoryId = '';
  protected specialtyId = '';
  protected locationId = '';
  protected status = '';
  protected priority = '';

  protected readonly categories = computed(() => {
    const breakdown = this.result()?.by_category ?? [];
    const dynamic = breakdown
      .map((item) => ({
        value: item?.category ?? '',
        label: item?.category ? this.categoryLabel(item.category) : 'Sin categoría',
      }))
      .filter((item) => item.value !== '');
    return dynamic.length > 0 ? dynamic : CATEGORIES;
  });

  protected readonly breakdowns = computed(() => {
    const data = this.result();
    return [
      { title: 'Por categoría', rows: data?.by_category ?? [], kind: 'category' as const },
      { title: 'Por estado', rows: data?.by_status ?? [], kind: 'status' as const },
      { title: 'Por prioridad', rows: data?.by_priority ?? [], kind: 'priority' as const },
      { title: 'Por edificio', rows: data?.by_building ?? [], kind: 'building' as const },
    ];
  });

  constructor() {
    this.loadCatalogs();
    this.generateReport();
  }

  protected generateReport(): void {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.error.set('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.request = this.reportsService
      .getSummary({
        start_date: this.startDate || undefined,
        end_date: this.endDate || undefined,
        category_id: this.categoryId
          ? (this.categoryId as IncidentCategory)
          : undefined,
        area_id: this.specialtyId ? Number(this.specialtyId) : undefined,
        location_id: this.locationId ? Number(this.locationId) : undefined,
        status: this.status ? (this.status as ReportStatus) : undefined,
        priority: this.priority ? (this.priority as Priority) : undefined,
        limit: this.pageSize,
        offset: (this.page() - 1) * this.pageSize,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.result.set({
            ...response,
            kpis: {
              total: response?.kpis?.total ?? 0,
              open: response?.kpis?.open ?? 0,
              in_progress: response?.kpis?.in_progress ?? 0,
              blocked: response?.kpis?.blocked ?? 0,
              resolved_closed: response?.kpis?.resolved_closed ?? 0,
              average_resolution_hours:
                response?.kpis?.average_resolution_hours ?? null,
            },
            by_category: response?.by_category ?? [],
            by_status: response?.by_status ?? [],
            by_priority: response?.by_priority ?? [],
            by_building: response?.by_building ?? [],
            items: response?.items ?? [],
            total: response?.total ?? 0,
            limit: response?.limit ?? this.pageSize,
            offset: response?.offset ?? 0,
          });
          this.loading.set(false);
        },
        error: (response: HttpErrorResponse) => {
          this.error.set(this.errorMessage(response));
          this.loading.set(false);
        },
      });
  }

  protected clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.categoryId = '';
    this.specialtyId = '';
    this.locationId = '';
    this.status = '';
    this.priority = '';
    this.page.set(1);
    this.generateReport();
  }

  protected changePage(direction: number): void {
    const nextPage = this.currentPage() + direction;
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }
    this.page.set(nextPage);
    this.generateReport();
  }

  protected printReport(): void {
    if (typeof window === 'undefined') {
      return;
    }
    document.body.classList.add('printing-report');
    const cleanup = () => document.body.classList.remove('printing-report');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  }

  protected statusLabel(value: string): string {
    return STATUSES.includes(value as ReportStatus) ? statusLabel(value as ReportStatus) : value;
  }

  protected priorityLabel(value: string | null | undefined): string {
    if (!value) {
      return 'Sin prioridad';
    }
    return PRIORITY_LABELS[value.toLowerCase()] ?? value;
  }

  protected priorityKey(value: string | null | undefined): string {
    return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  protected categoryLabel(value: string | null | undefined): string {
    if (!value) {
      return 'Sin categoría';
    }
    return CATEGORY_LABELS.get(value.toLowerCase()) ?? value;
  }

  protected breakdownLabel(
    item: ReportsSummaryCategory | ReportsSummaryStatus | ReportsSummaryPriority | ReportsSummaryBuilding | null | undefined,
    kind: 'category' | 'status' | 'priority' | 'building',
  ): string {
    if (!item) {
      return 'Sin información';
    }
    if (kind === 'category') {
      const category = item as ReportsSummaryCategory;
      return category?.category ? this.categoryLabel(category.category) : 'Sin categoría';
    }
    if (kind === 'status') {
      return this.statusLabel((item as ReportsSummaryStatus)?.status ?? 'Sin estado');
    }
    if (kind === 'priority') {
      return this.priorityLabel((item as ReportsSummaryPriority)?.priority);
    }
    return (item as ReportsSummaryBuilding)?.building ?? 'Sin edificio';
  }

  protected share(
    count: number | null | undefined,
    rows: Array<ReportsSummaryCategory | ReportsSummaryStatus | ReportsSummaryPriority | ReportsSummaryBuilding> | null | undefined,
  ): number {
    const total = (rows ?? []).reduce((sum, item) => sum + (item?.count ?? 0), 0);
    return total > 0 ? Math.round(((count ?? 0) / total) * 100) : 0;
  }

  protected itemCategory(item: ReportsSummaryItem | null | undefined): string {
    return item?.category ? this.categoryLabel(item.category) : 'Sin categoría';
  }

  protected itemLocation(item: ReportsSummaryItem | null | undefined): string {
    return item?.location ?? '—';
  }

  protected itemAssignee(item: ReportsSummaryItem | null | undefined): string {
    return item?.assignee ?? 'Sin asignar';
  }

  protected currentPage(): number {
    const data = this.result();
    const limit = data?.limit ?? this.pageSize;
    return Math.floor((data?.offset ?? 0) / Math.max(limit, 1)) + 1;
  }

  protected totalItems(): number {
    return this.result()?.total ?? this.result()?.items?.length ?? 0;
  }

  protected totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems() / (this.result()?.limit ?? this.pageSize)));
  }

  private loadCatalogs(): void {
    this.catalogRequestsRemaining = 2;
    this.catalogsLoading.set(true);
    this.reportsApi
      .listSpecialties()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.finishCatalogRequest()),
      )
      .subscribe({
        next: (items) => this.specialties.set(items),
        error: () => this.catalogsError.update((value) =>
          [value, 'No se pudieron cargar las áreas/especialidades.'].filter(Boolean).join(' '),
        ),
      });
    this.catalogApi
      .listLocations()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.finishCatalogRequest()),
      )
      .subscribe({
        next: (items) => this.locations.set(items),
        error: () => this.catalogsError.update((value) =>
          [value, 'No se pudieron cargar las ubicaciones.'].filter(Boolean).join(' '),
        ),
      });
  }

  private finishCatalogRequest(): void {
    this.catalogRequestsRemaining -= 1;
    if (this.catalogRequestsRemaining === 0) {
      this.catalogsLoading.set(false);
    }
  }

  private errorMessage(response: HttpErrorResponse): string {
    if (response.status === 403) {
      return 'No tienes permiso para consultar reportes.';
    }
    if (typeof response.error?.detail === 'string') {
      return response.error.detail;
    }
    return 'No se pudo generar el reporte. Intenta de nuevo.';
  }

}
