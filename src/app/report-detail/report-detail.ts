import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import {
  IncidentCategory,
  Priority,
  ReportStatus,
  RoleSlug,
} from '../data/models';
import {
  ApiAssignment,
  ApiDiagnosis,
  ApiReport,
  ApiSpecialty,
  ApiStatusEvent,
  ApiWorkLog,
  ReportsApiService,
} from '../data/reports-api.service';
import { statusLabel } from '../data/report-status';
import {
  ApiUser,
  UsersApiService,
} from '../data/users-api.service';
import { ReportStatusTimeline } from '../report-status-timeline/report-status-timeline';
import { BreadcrumbService } from '../session/breadcrumb.service';
import { RoleSessionService } from '../session/role-session.service';
import { ToastService } from '../ui/toast/toast.service';


const CATEGORIZABLE: ReportStatus[] = [
  'reportada',
  'validada',
  'reabierta',
];

const ASSIGNABLE: ReportStatus[] = [
  'validada',
  'asignada',
  'reabierta',
  'bloqueada',
];

const REOPEN_FROM: ReportStatus[] = [
  'en_validacion',
  'resuelta',
  'cerrada',
];


@Component({
  selector: 'app-report-detail',

  imports: [
    RouterLink,
    ReportStatusTimeline,
    DatePipe,
    ReactiveFormsModule,
  ],

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

  private readonly fb = inject(FormBuilder);

  protected readonly session = inject(RoleSessionService);


  /* =======================================================
     DATOS GENERALES DEL REPORTE
     ======================================================= */

  protected readonly report = signal<ApiReport | null>(null);

  protected readonly loading = signal(true);

  protected readonly notFound = signal(false);

  protected readonly busy = signal(false);

  protected readonly specialties = signal<ApiSpecialty[]>([]);

  protected readonly technicians = signal<ApiUser[]>([]);

  protected readonly assignments = signal<ApiAssignment[]>([]);

  protected readonly events = signal<ApiStatusEvent[]>([]);

  protected readonly names = signal<Record<number, string>>({});


  protected readonly category =
    signal<IncidentCategory | ''>('');

  protected readonly priority =
    signal<Priority | ''>('');

  protected readonly assigneeId =
    signal<number | null>(null);

  protected readonly comment = signal('');


  protected readonly statusLabel = statusLabel;


  private folio = '';


  protected readonly role =
    computed<RoleSlug>(() => this.session.currentSlug());


  /* =======================================================
     HU-11 — DIAGNÓSTICO
     ======================================================= */

  protected readonly diagnosis =
    signal<ApiDiagnosis | null>(null);

  protected readonly diagnosisLoading =
    signal(true);

  protected readonly diagnosisSaving =
    signal(false);


  protected readonly diagnosisForm =
    this.fb.nonNullable.group({

      evaluation: [
        '',
        [
          Validators.required,
        ],
      ],

      rootCause: [
        '',
        [
          Validators.required,
        ],
      ],

    });


  /* =======================================================
     HU-12 — BITÁCORA DE ACTIVIDADES
     ======================================================= */

  protected readonly workLogs =
    signal<ApiWorkLog[]>([]);

  protected readonly workLogsLoading =
    signal(true);

  protected readonly workLogSaving =
    signal(false);


  protected readonly workLogForm =
    this.fb.nonNullable.group({

      tasks: [
        '',
        [
          Validators.required,
        ],
      ],

      materials: [
        '',
        [
          Validators.required,
        ],
      ],

      timeMinutes: [
        1,
        [
          Validators.required,
          Validators.min(1),
        ],
      ],

    });


  /* =======================================================
     PERMISOS DEL WORKFLOW EXISTENTE
     ======================================================= */

  protected readonly canCategorize = computed(() => {

    const item = this.report();

    return (
      !!item &&
      this.isRole(
        'responsable',
        'administrador',
      ) &&
      CATEGORIZABLE.includes(item.status)
    );

  });


  protected readonly canAssign = computed(() => {

    const item = this.report();

    return (
      !!item &&
      item.category != null &&
      this.isRole(
        'responsable',
        'coordinador',
        'administrador',
      ) &&
      ASSIGNABLE.includes(item.status)
    );

  });


  protected readonly canValidate = computed(() => {

    const item = this.report();

    return (
      !!item &&
      item.status === 'reportada' &&
      this.isRole(
        'responsable',
        'coordinador',
        'administrador',
      )
    );

  });


  protected readonly canStart =
    computed(() =>
      this.technicianMove(
        'asignada',
        'reabierta',
      )
    );


  protected readonly canSendValidation =
    computed(() =>
      this.technicianMove(
        'en_progreso',
      )
    );


  protected readonly canResolve =
    computed(() =>
      this.technicianMove(
        'en_validacion',
      )
    );


  protected readonly canBlock = computed(() => {

    const item = this.report();

    if (
      !item ||
      (
        item.status !== 'asignada' &&
        item.status !== 'en_progreso'
      )
    ) {
      return false;
    }

    return (
      this.isAssignee() ||
      this.role() === 'responsable'
    );

  });


  protected readonly canUnblock = computed(() => {

    const item = this.report();

    return (
      !!item &&
      item.status === 'bloqueada' &&
      !!this.resumeStatus() &&
      (
        this.isAssignee() ||
        this.role() === 'responsable'
      )
    );

  });


  protected readonly canClose = computed(() => {

    const item = this.report();

    return (
      !!item &&
      item.status === 'resuelta' &&
      (
        this.isAuthor() ||
        this.role() === 'validador'
      )
    );

  });


  protected readonly canReopen = computed(() => {

    const item = this.report();

    return (
      !!item &&
      REOPEN_FROM.includes(item.status) &&
      (
        this.isAuthor() ||
        this.role() === 'validador'
      )
    );

  });


  protected readonly resumeStatus =
    computed<ReportStatus | null>(() => {

      const blocked =
        this.events().find(
          (event) =>
            event.toStatus === 'bloqueada',
        );

      return blocked?.fromStatus ?? null;

    });


  protected readonly showActions =
    computed(() =>

      this.canCategorize() ||
      this.canAssign() ||
      this.canValidate() ||
      this.canStart() ||
      this.canSendValidation() ||
      this.canResolve() ||
      this.canBlock() ||
      this.canUnblock() ||
      this.canClose() ||
      this.canReopen()

    );


  /* =======================================================
     PERMISO TÉCNICO HU-11 / HU-12
     ======================================================= */

  protected readonly canWriteTechnical =
    computed(() => {

      const item = this.report();

      return (
        !!item &&
        this.role() === 'tecnico' &&
        this.isAssignee()
      );

    });


  /* =======================================================
     INICIALIZACIÓN
     ======================================================= */

  ngOnInit(): void {

    this.folio =
      this.route.snapshot.paramMap.get('id') ?? '';


    this.loadReport();

    this.loadHistory();

    this.loadDiagnosis();

    this.loadWorkLogs();


    this.api
      .listSpecialties()
      .subscribe({

        next: (items) =>
          this.specialties.set(items),

        error: () =>
          this.specialties.set([]),

      });


    this.usersApi
      .list()
      .subscribe({

        next: (users) => {

          const names:
            Record<number, string> = {};


          for (const user of users) {

            names[user.id] =
              user.name;

          }


          this.names.set(names);


          this.technicians.set(

            users.filter(
              (user) =>
                user.is_active &&
                user.roles.includes('tecnico'),
            ),

          );

        },


        error: () => {

          this.names.set({});

          this.technicians.set([]);

        },

      });

  }


  ngOnDestroy(): void {

    this.crumbs.reportTitle.set(null);

  }


  /* =======================================================
     FUNCIONES DE APOYO
     ======================================================= */

  protected locationLines(
    label?: string,
  ): string[] {

    if (!label) {

      return ['—'];

    }

    return label
      .split(' - ')
      .map(
        (part) =>
          part.trim(),
      );

  }


  protected personName(
    id: number,
  ): string {

    return (
      this.names()[id] ??
      `Usuario ${id}`
    );

  }


  protected onCategory(
    event: Event,
  ): void {

    this.category.set(

      (
        event.target as HTMLSelectElement
      ).value as IncidentCategory | '',

    );

  }


  protected onPriority(
    event: Event,
  ): void {

    this.priority.set(

      (
        event.target as HTMLSelectElement
      ).value as Priority | '',

    );

  }


  protected onAssignee(
    event: Event,
  ): void {

    const value =
      Number(
        (
          event.target as HTMLSelectElement
        ).value,
      );


    this.assigneeId.set(

      Number.isFinite(value) &&
      value > 0

        ? value

        : null,

    );

  }


  protected onComment(
    event: Event,
  ): void {

    this.comment.set(

      (
        event.target as HTMLTextAreaElement
      ).value,

    );

  }


  /* =======================================================
     WORKFLOW EXISTENTE
     ======================================================= */

  protected categorize(): void {

    const category =
      this.category();

    const priority =
      this.priority();


    if (
      !category ||
      !priority
    ) {

      this.toast.show(
        'Elige categoría y prioridad.',
      );

      return;

    }


    this.run(

      () =>
        this.api.categorize(
          this.folio,
          {
            category,
            priority,
          },
        ),

      'Incidencia categorizada',

    );

  }


  protected assign(): void {

    const assigneeId =
      this.assigneeId();


    if (!assigneeId) {

      this.toast.show(
        'Elige un técnico.',
      );

      return;

    }


    this.run(

      () =>
        this.api.assign(
          this.folio,
          assigneeId,
        ),

      'Responsable asignado',

    );

  }


  protected move(
    status: ReportStatus,
    needsComment = false,
  ): void {

    const comment =
      this.comment().trim();


    if (
      needsComment &&
      !comment
    ) {

      this.toast.show(
        'Escribe un comentario para esta acción.',
      );

      return;

    }


    this.run(

      () =>
        this.api.changeStatus(
          this.folio,
          {
            status,
            comment:
              comment || null,
          },
        ),

      'Estado actualizado',

    );

  }


  /* =======================================================
     HU-11 — REGISTRAR DIAGNÓSTICO
     ======================================================= */

  protected submitDiagnosis(): void {

    if (
      this.diagnosisSaving() ||
      this.diagnosisForm.invalid
    ) {

      this.diagnosisForm.markAllAsTouched();

      return;

    }


    const values =
      this.diagnosisForm.getRawValue();


    this.diagnosisSaving.set(true);


    this.api
      .createDiagnosis(
        this.folio,
        {
          evaluation:
            values.evaluation.trim(),

          rootCause:
            values.rootCause.trim(),
        },
      )
      .subscribe({

        next: (diagnosis) => {

          this.diagnosis.set(
            diagnosis,
          );

          this.diagnosisSaving.set(
            false,
          );

          this.diagnosisForm.reset({

            evaluation: '',

            rootCause: '',

          });


          this.toast.show(
            'Diagnóstico registrado',
          );

        },


        error: (
          err: HttpErrorResponse,
        ) => {

          this.diagnosisSaving.set(
            false,
          );

          this.toast.show(
            this.errorMessage(err),
          );

        },

      });

  }


  /* =======================================================
     HU-12 — REGISTRAR ACTIVIDAD
     ======================================================= */

  protected submitWorkLog(): void {

    if (
      this.workLogSaving() ||
      this.workLogForm.invalid
    ) {

      this.workLogForm.markAllAsTouched();

      return;

    }


    const values =
      this.workLogForm.getRawValue();


    this.workLogSaving.set(true);


    this.api
      .createWorkLog(
        this.folio,
        {
          tasks:
            values.tasks.trim(),

          materials:
            values.materials.trim(),

          timeMinutes:
            values.timeMinutes,
        },
      )
      .subscribe({

        next: (workLog) => {

          this.workLogs.update(
            (items) => [
              ...items,
              workLog,
            ],
          );


          this.workLogSaving.set(
            false,
          );


          this.workLogForm.reset({

            tasks: '',

            materials: '',

            timeMinutes: 1,

          });


          this.toast.show(
            'Actividad registrada',
          );

        },


        error: (
          err: HttpErrorResponse,
        ) => {

          this.workLogSaving.set(
            false,
          );

          this.toast.show(
            this.errorMessage(err),
          );

        },

      });

  }


  /* =======================================================
     PERMISOS
     ======================================================= */

  private technicianMove(
    ...from: ReportStatus[]
  ): boolean {

    const item =
      this.report();


    return (
      !!item &&
      this.role() === 'tecnico' &&
      this.isAssignee() &&
      from.includes(item.status)
    );

  }


  private isAssignee(): boolean {

    const item =
      this.report();


    return (
      !!item &&
      item.assigneeId ===
        this.auth.currentUser()?.id
    );

  }


  private isAuthor(): boolean {

    const item =
      this.report();


    return (
      !!item &&
      item.authorId ===
        this.auth.currentUser()?.id
    );

  }


  private isRole(
    ...roles: RoleSlug[]
  ): boolean {

    return roles.includes(
      this.role(),
    );

  }


  /* =======================================================
     CARGA DEL REPORTE
     ======================================================= */

  private loadReport(): void {

    this.api
      .getByFolio(
        this.folio,
      )
      .subscribe({

        next: (item) => {

          this.report.set(
            item,
          );


          this.crumbs
            .reportTitle
            .set(
              item.title,
            );


          if (item.category) {

            this.category.set(
              item.category,
            );

          }


          if (item.priority) {

            this.priority.set(
              item.priority,
            );

          }


          if (item.assigneeId) {

            this.assigneeId.set(
              item.assigneeId,
            );

          }


          this.loading.set(
            false,
          );

        },


        error: (
          err: HttpErrorResponse,
        ) => {

          this.notFound.set(
            err.status === 404,
          );

          this.loading.set(
            false,
          );

        },

      });

  }


  /* =======================================================
     HISTORIAL HU-09 / HU-10
     ======================================================= */

  private loadHistory(): void {

    this.api
      .listAssignments(
        this.folio,
      )
      .subscribe({

        next: (rows) =>
          this.assignments.set(rows),

        error: () =>
          this.assignments.set([]),

      });


    this.api
      .listStatusEvents(
        this.folio,
      )
      .subscribe({

        next: (rows) =>
          this.events.set(rows),

        error: () =>
          this.events.set([]),

      });

  }


  /* =======================================================
     CARGA HU-11
     ======================================================= */

  private loadDiagnosis(): void {

    this.diagnosisLoading.set(
      true,
    );


    this.api
      .getDiagnosis(
        this.folio,
      )
      .subscribe({

        next: (diagnosis) => {

          this.diagnosis.set(
            diagnosis,
          );

          this.diagnosisLoading.set(
            false,
          );

        },


        error: (
          err: HttpErrorResponse,
        ) => {

          if (err.status === 404) {

            this.diagnosis.set(
              null,
            );

          }


          this.diagnosisLoading.set(
            false,
          );

        },

      });

  }


  /* =======================================================
     CARGA HU-12
     ======================================================= */

  private loadWorkLogs(): void {

    this.workLogsLoading.set(
      true,
    );


    this.api
      .listWorkLogs(
        this.folio,
      )
      .subscribe({

        next: (rows) => {

          this.workLogs.set(
            rows,
          );

          this.workLogsLoading.set(
            false,
          );

        },


        error: () => {

          this.workLogs.set(
            [],
          );

          this.workLogsLoading.set(
            false,
          );

        },

      });

  }


  /* =======================================================
     OPERACIONES GENERALES DEL WORKFLOW
     ======================================================= */

  private run(
    request:
      () =>
        ReturnType<
          ReportsApiService['changeStatus']
        >,
    success: string,
  ): void {

    if (this.busy()) {

      return;

    }


    this.busy.set(
      true,
    );


    request()
      .subscribe({

        next: (item) => {

          this.report.set(
            item,
          );


          this.comment.set(
            '',
          );


          this.busy.set(
            false,
          );


          this.toast.show(
            success,
          );


          this.loadHistory();

        },


        error: (
          err: HttpErrorResponse,
        ) => {

          this.busy.set(
            false,
          );


          this.toast.show(
            this.errorMessage(err),
          );

        },

      });

  }


  /* =======================================================
     MENSAJES DE ERROR
     ======================================================= */

  private errorMessage(
    err: HttpErrorResponse,
  ): string {

    const detail =
      err.error?.detail;


    if (
      typeof detail === 'string'
    ) {

      return detail;

    }


    if (
      Array.isArray(detail)
    ) {

      const text =
        detail
          .map(
            (item) =>
              typeof item?.msg ===
              'string'

                ? item.msg

                : '',
          )
          .filter(Boolean)
          .join(' ');


      if (text) {

        return text;

      }

    }


    return (
      'No se pudo completar la acción.'
    );

  }

}