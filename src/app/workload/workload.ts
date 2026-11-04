import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, Subscription, Subject, switchMap, startWith, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkloadApiService, LoadSummary, LoadPage, LoadFilters } from '../data/workload-api.service';
import { ApiReport, ReportsApiService } from '../data/reports-api.service';
import { ApiUser, UsersApiService } from '../data/users-api.service';
import { LoadGroup } from '../data/workload-api.service';
import { Dialog } from '../ui/dialog/dialog';
import { ToastService } from '../ui/toast/toast.service';
import { ReportStatus } from '../data/models';
import { statusLabel } from '../data/report-status';

@Component({
  selector: 'app-workload', imports: [FormsModule, RouterLink, DatePipe, Dialog],
  templateUrl: './workload.html', styleUrl: './workload.css',
})
export class Workload {
  private readonly api = inject(WorkloadApiService);
  private readonly reportsApi = inject(ReportsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private assignmentLoad: Subscription | undefined;
  readonly assignmentTarget = signal<LoadGroup | null>(null);
  readonly assignmentLoading = signal(false);
  readonly assignmentBusy = signal(false);
  readonly assignmentError = signal('');
  readonly assignmentReports = signal<ApiReport[]>([]);
  readonly assignmentUsers = signal<ApiUser[]>([]);
  readonly assignmentMode = signal<'assign' | 'reassign'>('assign');
  readonly selectedFolio = signal('');
  readonly selectedReport = computed(() => this.assignmentReports().find(r => r.folio === this.selectedFolio()));
  readonly eligibleReports = computed(() => this.assignmentReports().filter(r =>
    r.category !== null && r.specialtyId !== null &&
    ['validada', 'asignada', 'reabierta', 'bloqueada'].includes(r.status) &&
    r.assigneeId !== this.assignmentTarget()?.assigneeId &&
    (this.assignmentMode() === 'assign' ? r.assigneeId === null : r.assigneeId !== null)
  ));
  openAssignment(target: LoadGroup) {
    if (target.assigneeId === null) return;
    this.assignmentTarget.set(target);
    this.assignmentMode.set('assign');
    this.selectedFolio.set('');
    this.assignmentReports.set([]);
    this.assignmentUsers.set([]);
    this.loadAssignment();
  }
  loadAssignment() {
    this.assignmentLoad?.unsubscribe();
    this.assignmentLoading.set(true);
    this.assignmentError.set('');
    this.assignmentLoad = forkJoin({ reports: this.reportsApi.list(), users: this.usersApi.list() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: ({ reports, users }) => {
          this.assignmentLoading.set(false);
          this.assignmentUsers.set(users);
          const target = users.find(u => u.id === this.assignmentTarget()?.assigneeId);
          if (!target?.is_active || !target.roles.includes('tecnico')) {
            this.assignmentError.set('Este usuario no es un técnico activo. Selecciona otro técnico.');
            return;
          }
          this.assignmentReports.set(reports.filter(r => !this.specialtyId || r.specialtyId === Number(this.specialtyId)));
        },
        error: () => {
          this.assignmentLoading.set(false);
          this.assignmentError.set('No se pudieron consultar las incidencias elegibles. Intenta de nuevo.');
        },
      });
  }
  changeAssignmentMode(mode: 'assign' | 'reassign') {
    this.assignmentMode.set(mode); this.selectedFolio.set('');
  }
  assigneeName(id: number | null) {
    return this.assignmentUsers().find(u => u.id === id)?.name ?? 'Sin técnico';
  }
  closeAssignment() {
    if (!this.assignmentBusy()) { this.assignmentLoad?.unsubscribe(); this.assignmentTarget.set(null); }
  }
  confirmAssignment() {
    const target = this.assignmentTarget();
    const report = this.eligibleReports().find(r => r.folio === this.selectedFolio());
    if (!target?.assigneeId || !report || this.assignmentBusy() || this.assignmentLoading()) return;
    this.assignmentBusy.set(true); this.assignmentError.set('');
    this.reportsApi.assign(report.folio, target.assigneeId)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.assignmentBusy.set(false); this.assignmentTarget.set(null);
          this.toast.show(report.assigneeId === null ? 'Incidencia asignada correctamente.' : 'Incidencia reasignada correctamente.');
          this.refresh.next();
        },
        error: error => {
          this.assignmentBusy.set(false);
          this.assignmentError.set(typeof error.error?.detail === 'string' ? error.error.detail : 'No se pudo guardar la asignación. Intenta de nuevo.');
        },
      });
  }
  private readonly refresh = new Subject<void>();
  readonly summary = signal<LoadSummary | null>(null);
  readonly options = signal<LoadSummary | null>(null);
  readonly page = signal<LoadPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly statusLabel = statusLabel;
  readonly statuses: ReportStatus[] = ['reportada','validada','asignada','en_progreso','en_validacion','resuelta','cerrada','bloqueada','reabierta'];
  specialtyId = ''; assigneeId = ''; status = ''; priority = ''; pendingOnly = false;
  offset = 0; readonly limit = 20;

  constructor() {
    this.refresh.pipe(startWith(undefined), switchMap(() => {
      this.loading.set(true); this.error.set('');
      const shared: LoadFilters = { specialtyId: this.specialtyId, assigneeId: this.assigneeId };
      return forkJoin({
        options: this.api.summary(), summary: this.api.summary(shared),
        page: this.api.reports({ ...shared, status: this.status, priority: this.priority,
          pendingOnly: this.pendingOnly, offset: this.offset, limit: this.limit }),
      }).pipe(catchError(error => {
        this.error.set(error.status === 403 ? 'No tienes permiso para consultar las cargas.' : 'No se pudieron cargar los datos. Intenta de nuevo.');
        return of(null);
      }));
    }), takeUntilDestroyed(inject(DestroyRef))).subscribe(result => {
      this.loading.set(false);
      if (result) { this.options.set(result.options); this.summary.set(result.summary); this.page.set(result.page); }
    });
  }
  apply() { this.offset = 0; this.refresh.next(); }
  reset() { this.specialtyId = ''; this.assigneeId = ''; this.status = ''; this.priority = ''; this.pendingOnly = false; this.apply(); }
  paginate(direction: number) { this.offset += direction * this.limit; this.refresh.next(); }
  priorityLabel(value: string | null) {
    return ({ baja: 'Baja', media: 'Media', alta: 'Alta', unclassified: 'Sin prioridad' } as Record<string,string>)[value ?? 'unclassified'];
  }
  statusBreakdown(values: Record<string, number>) {
    return this.statuses.filter(s => values[s] > 0).map(s => `${statusLabel(s)}: ${values[s]}`).join(' · ') || 'Sin incidencias';
  }
  priorityBreakdown(values: Record<string, number>) {
    return Object.entries(values).filter(([,n]) => n > 0).map(([p,n]) => `${this.priorityLabel(p)}: ${n}`).join(' · ') || 'Sin incidencias';
  }
}
