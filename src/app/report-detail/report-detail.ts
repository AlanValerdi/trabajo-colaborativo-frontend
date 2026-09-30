import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { IncidentCategory, Priority, ReportStatus, RoleSlug } from '../data/models';
import {
  ApiAssignment,
  ApiComment,
  ApiReport,
  ApiSpecialty,
  ApiStatusEvent,
  ReportsApiService,
} from '../data/reports-api.service';
import { statusLabel } from '../data/report-status';
import { ApiUser, UsersApiService } from '../data/users-api.service';
import { ReportStatusTimeline } from '../report-status-timeline/report-status-timeline';
import { BreadcrumbService } from '../session/breadcrumb.service';
import { RoleSessionService } from '../session/role-session.service';
import { ToastService } from '../ui/toast/toast.service';

const CATEGORIZABLE: ReportStatus[] = ['reportada', 'validada', 'reabierta'];
const ASSIGNABLE: ReportStatus[] = ['validada', 'asignada', 'reabierta', 'bloqueada'];
const REOPEN_FROM: ReportStatus[] = ['en_validacion', 'resuelta', 'cerrada'];

@Component({
  selector: 'app-report-detail',
  imports: [RouterLink, ReportStatusTimeline, DatePipe],
  templateUrl: './report-detail.html',
  styleUrl: './report-detail.css',
})
export class ReportDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ReportsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly auth = inject(AuthService);
  private readonly crumbs = inject(BreadcrumbService);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(RoleSessionService);

  protected readonly report = signal<ApiReport | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly busy = signal(false);
  protected readonly specialties = signal<ApiSpecialty[]>([]);
  protected readonly technicians = signal<ApiUser[]>([]);
  protected readonly assignments = signal<ApiAssignment[]>([]);
  protected readonly events = signal<ApiStatusEvent[]>([]);
  protected readonly names = signal<Record<number, string>>({});

  /* Signals para Comentarios */
  protected readonly comments = signal<ApiComment[]>([]);
  protected readonly newCommentText = signal('');
  protected readonly editingCommentId = signal<number | null>(null);
  protected readonly editingContent = signal('');

  protected readonly category = signal<IncidentCategory | ''>('');
  protected readonly priority = signal<Priority | ''>('');
  protected readonly assigneeId = signal<number | null>(null);
  protected readonly comment = signal('');

  protected readonly statusLabel = statusLabel;

  private folio = '';

  protected readonly role = computed<RoleSlug>(() => this.session.currentSlug());

  protected readonly canCategorize = computed(() => {
    const item = this.report();
    return !!item && this.isRole('responsable', 'administrador') && CATEGORIZABLE.includes(item.status);
  });

  protected readonly canAssign = computed(() => {
    const item = this.report();
    return (
      !!item &&
      item.category != null &&
      this.isRole('responsable', 'coordinador', 'administrador') &&
      ASSIGNABLE.includes(item.status)
    );
  });

  protected readonly canValidate = computed(() => {
    const item = this.report();
    return !!item && item.status === 'reportada' && this.isRole('responsable', 'coordinador', 'administrador');
  });

  protected readonly canStart = computed(() => this.technicianMove('asignada', 'reabierta'));
  protected readonly canSendValidation = computed(() => this.technicianMove('en_progreso'));
  protected readonly canResolve = computed(() => this.technicianMove('en_validacion'));

  protected readonly canBlock = computed(() => {
    const item = this.report();
    if (!item || (item.status !== 'asignada' && item.status !== 'en_progreso')) {
      return false;
    }
    return this.isAssignee() || this.role() === 'responsable';
  });

  protected readonly canUnblock = computed(() => {
    const item = this.report();
    return !!item && item.status === 'bloqueada' && !!this.resumeStatus() && (this.isAssignee() || this.role() === 'responsable');
  });

  protected readonly canClose = computed(() => {
    const item = this.report();
    return !!item && item.status === 'resuelta' && (this.isAuthor() || this.role() === 'validador');
  });

  protected readonly canReopen = computed(() => {
    const item = this.report();
    return !!item && REOPEN_FROM.includes(item.status) && (this.isAuthor() || this.role() === 'validador');
  });

  protected readonly resumeStatus = computed<ReportStatus | null>(() => {
    const blocked = this.events().find((event) => event.toStatus === 'bloqueada');
    return blocked?.fromStatus ?? null;
  });

  protected readonly showActions = computed(
    () =>
      this.canCategorize() ||
      this.canAssign() ||
      this.canValidate() ||
      this.canStart() ||
      this.canSendValidation() ||
      this.canResolve() ||
      this.canBlock() ||
      this.canUnblock() ||
      this.canClose() ||
      this.canReopen(),
  );

  ngOnInit(): void {
    this.folio = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadReport();
    this.loadHistory();

    this.api.listSpecialties().subscribe({
      next: (items) => this.specialties.set(items),
      error: () => this.specialties.set([]),
    });

    // Registrar al usuario logueado en el almacenamiento local de nombres
    const currentUser = this.auth.currentUser();
    if (currentUser && currentUser.name) {
      try {
        const known = JSON.parse(localStorage.getItem('known_user_names') || '{}');
        known[Number(currentUser.id)] = currentUser.name;
        localStorage.setItem('known_user_names', JSON.stringify(known));
      } catch {}
    }

    // Cargar lista de usuarios (si el usuario tiene permisos) y mezclar con la memoria local
    this.usersApi.list().subscribe({
      next: (users) => {
        let known: Record<number, string> = {};
        try {
          known = JSON.parse(localStorage.getItem('known_user_names') || '{}');
        } catch {}

        for (const user of users) {
          known[Number(user.id)] = user.name;
        }
        try {
          localStorage.setItem('known_user_names', JSON.stringify(known));
        } catch {}

        this.names.set(known);
        this.technicians.set(users.filter((user) => user.is_active && user.roles.includes('tecnico')));
        this.loadComments();
      },
      error: () => {
        let known: Record<number, string> = {};
        try {
          known = JSON.parse(localStorage.getItem('known_user_names') || '{}');
        } catch {}

        this.names.set(known);
        this.technicians.set([]);
        this.loadComments();
      },
    });
  }

  ngOnDestroy(): void {
    this.crumbs.reportTitle.set(null);
  }

  protected cleanText(text?: string | null): string {
    if (!text) return '—';
    try {
      return decodeURIComponent(escape(text));
    } catch {
      return text.replace(/Ã³/g, 'ó').replace(/Ã/g, 'á');
    }
  }

  protected locationLines(label?: string): string[] {
    if (!label || !label.trim()) {
      return ['—'];
    }
    return label.split(' - ').map((part) => this.cleanText(part.trim()));
  }

  /* Resolución de nombres combinando memoria local y entidades */
  protected personName(id: number): string {
    const targetId = Number(id);

    // 1. Consultar en la lista general / localStorage
    const known = this.names();
    if (known[targetId]) {
      return known[targetId];
    }

    // 2. Coincidencia con autor del reporte
    const reportItem = this.report();
    if (reportItem && Number(reportItem.authorId) === targetId && reportItem.author?.name) {
      return reportItem.author.name;
    }

    // 3. Coincidencia con usuario logueado en la sesión activa
    const currentUser = this.auth.currentUser();
    if (currentUser && Number(currentUser.id) === targetId && currentUser.name) {
      return currentUser.name;
    }

    return `Usuario ${id}`;
  }

  protected personInitial(id: number): string {
    const name = this.personName(id);
    if (!name || name.startsWith('Usuario')) return 'U';
    return name.charAt(0).toUpperCase();
  }

  /* Formateador seguro de fecha ISO */
  protected formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const formattedStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`;
    return formattedStr;
  }

  protected onCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value as IncidentCategory | '');
  }

  protected onPriority(event: Event): void {
    this.priority.set((event.target as HTMLSelectElement).value as Priority | '');
  }

  protected onAssignee(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.assigneeId.set(Number.isFinite(value) && value > 0 ? value : null);
  }

  protected onComment(event: Event): void {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }

  protected categorize(): void {
    const category = this.category();
    const priority = this.priority();
    if (!category || !priority) {
      this.toast.show('Elige categoría y prioridad.');
      return;
    }
    this.run(() => this.api.categorize(this.folio, { category, priority }), 'Incidencia categorizada');
  }

  protected assign(): void {
    const assigneeId = this.assigneeId();
    if (!assigneeId) {
      this.toast.show('Elige un técnico.');
      return;
    }
    this.run(() => this.api.assign(this.folio, assigneeId), 'Responsable asignado');
  }

  protected move(status: ReportStatus, needsComment = false): void {
    const comment = this.comment().trim();
    if (needsComment && !comment) {
      this.toast.show('Escribe un comentario para esta acción.');
      return;
    }
    this.run(
      () => this.api.changeStatus(this.folio, { status, comment: comment || null }),
      'Estado actualizado',
    );
  }

  /* --- Funciones de Comentarios --- */
  protected loadComments(): void {
    const item = this.report();
    if (!item) return;

    this.api.getComments(item.id).subscribe({
      next: (items) => this.comments.set(items),
      error: () => this.comments.set([]),
    });
  }

  protected onNewCommentInput(event: Event): void {
    this.newCommentText.set((event.target as HTMLTextAreaElement).value);
  }

  protected onEditCommentInput(event: Event): void {
    this.editingContent.set((event.target as HTMLTextAreaElement).value);
  }

  protected addComment(): void {
    const text = this.newCommentText().trim();
    const item = this.report();

    if (!text) {
      this.toast.show('Escribe un comentario antes de publicar.');
      return;
    }
    if (!item) return;

    this.busy.set(true);
    this.api.createComment(item.id, text).subscribe({
      next: () => {
        this.newCommentText.set('');
        this.busy.set(false);
        this.toast.show('Comentario publicado');
        this.loadComments();
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.toast.show(this.errorMessage(err));
      },
    });
  }

  protected startEditComment(c: ApiComment): void {
    this.editingCommentId.set(c.id);
    this.editingContent.set(c.content);
  }

  protected cancelEditComment(): void {
    this.editingCommentId.set(null);
    this.editingContent.set('');
  }

  protected saveEditComment(commentId: number): void {
    const text = this.editingContent().trim();
    if (!text) return;

    this.busy.set(true);
    this.api.updateComment(commentId, text).subscribe({
      next: () => {
        this.editingCommentId.set(null);
        this.editingContent.set('');
        this.busy.set(false);
        this.toast.show('Comentario actualizado');
        this.loadComments();
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.toast.show(this.errorMessage(err));
      },
    });
  }

  protected deleteComment(commentId: number): void {
    if (!confirm('¿Deseas eliminar este comentario?')) return;

    this.busy.set(true);
    this.api.deleteComment(commentId).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.show('Comentario eliminado');
        this.loadComments();
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.toast.show(this.errorMessage(err));
      },
    });
  }

  /* Edición exclusiva para el autor del comentario */
  protected canEditComment(c: ApiComment): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    return Number(c.user_id) === Number(user.id);
  }

  /* Eliminación para el autor O administradores de la plataforma */
  protected canDeleteComment(c: ApiComment): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;

    const isOwner = Number(c.user_id) === Number(user.id);
    const currentSlug = this.role();
    const isAdmin = currentSlug === 'administrador' || user.roles?.includes('administrador');

    return isOwner || isAdmin;
  }

  private technicianMove(...from: ReportStatus[]): boolean {
    const item = this.report();
    return !!item && this.role() === 'tecnico' && this.isAssignee() && from.includes(item.status);
  }

  private isAssignee(): boolean {
    const item = this.report();
    return !!item && Number(item.assigneeId) === Number(this.auth.currentUser()?.id);
  }

  private isAuthor(): boolean {
    const item = this.report();
    return !!item && Number(item.authorId) === Number(this.auth.currentUser()?.id);
  }

  private isRole(...roles: RoleSlug[]): boolean {
    return roles.includes(this.role());
  }

  private loadReport(): void {
    this.api.getByFolio(this.folio).subscribe({
      next: (item) => {
        this.report.set(item);
        this.crumbs.reportTitle.set(item.title);
        if (item.category) {
          this.category.set(item.category);
        }
        if (item.priority) {
          this.priority.set(item.priority);
        }
        this.loading.set(false);
        this.loadComments();
      },
      error: (err: HttpErrorResponse) => {
        this.notFound.set(err.status === 404);
        this.loading.set(false);
      },
    });
  }

  private loadHistory(): void {
    this.api.listAssignments(this.folio).subscribe({
      next: (rows) => this.assignments.set(rows),
      error: () => this.assignments.set([]),
    });
    this.api.listStatusEvents(this.folio).subscribe({
      next: (rows) => this.events.set(rows),
      error: () => this.events.set([]),
    });
  }

  private run(request: () => ReturnType<ReportsApiService['changeStatus']>, success: string): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    request().subscribe({
      next: (item) => {
        this.report.set(item);
        this.comment.set('');
        this.busy.set(false);
        this.toast.show(success);
        this.loadHistory();
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.toast.show(this.errorMessage(err));
      },
    });
  }

  private errorMessage(err: HttpErrorResponse): string {
    const detail = err.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      const text = detail
        .map((item) => (typeof item?.msg === 'string' ? item.msg : ''))
        .filter(Boolean)
        .join(' ');
      if (text) {
        return text;
      }
    }
    return 'No se pudo completar la acción.';
  }
}
