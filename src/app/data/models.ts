export type RoleSlug =
  | 'reportante'
  | 'tecnico'
  | 'responsable'
  | 'coordinador'
  | 'validador'
  | 'administrador';

export type ReportStatus = 'creado' | 'en_revision' | 'resuelto';

export type Priority = 'baja' | 'media' | 'alta';

export interface Role {
  id: string;
  slug: RoleSlug;
  name: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  campusId: string;
  avatarUrl: string | null;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
}

export interface Space {
  id: string;
  campusId: string;
  code: string;
  room: string;
  label: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  campusId: string;
  spaceId: string;
  status: ReportStatus;
  imageUrl: string | null;
  authorId: string;
  classified: boolean;
  priority: Priority | null;
  awaitingValidation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  reportId: string;
  technicianId: string;
  assignedById: string;
  assignedAt: string;
}

export interface ReportEvent {
  id: string;
  reportId: string;
  status: ReportStatus;
  actorId: string;
  at: string;
}

export interface WorkLog {
  id: string;
  reportId: string;
  technicianId: string;
  notes: string;
  at: string;
}

export interface Validation {
  id: string;
  reportId: string;
  validatorId: string;
  resolved: boolean;
  comment: string;
  at: string;
}

export interface AppSettings {
  id: string;
  slaHours: number;
  allowCommunityReports: boolean;
  defaultCampusId: string;
}
