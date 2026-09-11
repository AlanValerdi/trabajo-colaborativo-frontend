import { Injectable, signal } from '@angular/core';
import {
  APP_SETTINGS,
  ASSIGNMENTS,
  CAMPUSES,
  CURRENT_REPORTANTE_ID,
  CURRENT_TECHNICIAN_ID,
  REPORT_EVENTS,
  REPORTS,
  ROLES,
  SPACES,
  USERS,
  VALIDATIONS,
  WORK_LOGS,
} from './mock-seed';
import {
  Assignment,
  Campus,
  Report,
  ReportEvent,
  Role,
  Space,
  User,
  Validation,
  WorkLog,
} from './models';

export interface CreateReportInput {
  title: string;
  campusId: string;
  spaceId: string;
  description: string;
  imageUrl: string | null;
}

export interface ActivityEntry {
  id: string;
  at: string;
  actorName: string;
  action: string;
  badge?: { label: string; tone: 'green' | 'blue' | 'gray' };
  note?: string;
  assignedTo?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly reportsState = signal<Report[]>([...REPORTS]);
  private readonly eventsState = signal<ReportEvent[]>([...REPORT_EVENTS]);

  readonly reports = this.reportsState.asReadonly();
  readonly roles: Role[] = ROLES;
  readonly users: User[] = USERS;
  readonly campuses: Campus[] = CAMPUSES;
  readonly spaces: Space[] = SPACES;
  readonly assignments: Assignment[] = ASSIGNMENTS;
  readonly workLogs: WorkLog[] = WORK_LOGS;
  readonly validations: Validation[] = VALIDATIONS;
  readonly settings = APP_SETTINGS;
  readonly currentReportanteId = CURRENT_REPORTANTE_ID;
  readonly currentTechnicianId = CURRENT_TECHNICIAN_ID;

  userById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  campusById(id: string): Campus | undefined {
    return this.campuses.find((campus) => campus.id === id);
  }

  spaceById(id: string): Space | undefined {
    return this.spaces.find((space) => space.id === id);
  }

  reportById(id: string): Report | undefined {
    return this.reportsState().find((report) => report.id === id);
  }

  eventsFor(reportId: string): ReportEvent[] {
    return this.eventsState()
      .filter((event) => event.reportId === reportId)
      .sort((a, b) => a.at.localeCompare(b.at));
  }

  assignmentFor(reportId: string): Assignment | undefined {
    return this.assignments.find((item) => item.reportId === reportId);
  }

  activityFor(reportId: string): ActivityEntry[] {
    const statusLabel: Record<Report['status'], string> = {
      creado: 'Creado',
      en_revision: 'En revisión',
      resuelto: 'Resuelto',
    };
    const statusTone: Record<Report['status'], 'green' | 'blue' | 'gray'> = {
      creado: 'gray',
      en_revision: 'blue',
      resuelto: 'green',
    };

    const items: ActivityEntry[] = this.eventsFor(reportId).map((event) => ({
      id: event.id,
      at: event.at,
      actorName: this.userById(event.actorId)?.name ?? 'Alguien',
      action: 'cambió el estado a',
      badge: { label: statusLabel[event.status], tone: statusTone[event.status] },
    }));

    for (const assignment of this.assignments.filter((item) => item.reportId === reportId)) {
      items.push({
        id: assignment.id,
        at: assignment.assignedAt,
        actorName: this.userById(assignment.assignedById)?.name ?? 'Alguien',
        action: 'asignó el reporte a',
        assignedTo: this.userById(assignment.technicianId)?.name,
      });
    }

    for (const log of this.workLogs.filter((item) => item.reportId === reportId)) {
      items.push({
        id: log.id,
        at: log.at,
        actorName: this.userById(log.technicianId)?.name ?? 'Alguien',
        action: 'documentó el trabajo realizado',
        note: log.notes,
      });
    }

    for (const validation of this.validations.filter((item) => item.reportId === reportId)) {
      items.push({
        id: validation.id,
        at: validation.at,
        actorName: this.userById(validation.validatorId)?.name ?? 'Alguien',
        action: validation.resolved ? 'confirmó que el problema quedó resuelto' : 'rechazó la solución',
        note: validation.comment,
      });
    }

    return items.sort((a, b) => b.at.localeCompare(a.at));
  }

  viewOf(report: Report) {
    return {
      report,
      campus: this.campusById(report.campusId),
      space: this.spaceById(report.spaceId),
      author: this.userById(report.authorId),
    };
  }

  technicianLoad(): { technician: User; count: number }[] {
    const technicians = this.users.filter((user) => user.roleId === 'rol-tecnico');
    return technicians.map((technician) => ({
      technician,
      count: this.assignments.filter((item) => item.technicianId === technician.id).length,
    }));
  }

  create(input: CreateReportInput): Report {
    const now = new Date().toISOString();
    const id = `rep-${this.newId()}`;
    const report: Report = {
      id,
      title: input.title,
      description: input.description,
      campusId: input.campusId,
      spaceId: input.spaceId,
      status: 'creado',
      imageUrl: input.imageUrl,
      authorId: this.currentReportanteId,
      classified: false,
      priority: null,
      awaitingValidation: false,
      createdAt: now,
      updatedAt: now,
    };

    this.reportsState.update((list) => [report, ...list]);
    this.eventsState.update((list) => [
      ...list,
      {
        id: `evt-${this.newId()}`,
        reportId: id,
        status: 'creado',
        actorId: this.currentReportanteId,
        at: now,
      },
    ]);

    return report;
  }

  private newId(): string {
    return Math.random().toString(36).slice(2, 10);
  }
}
