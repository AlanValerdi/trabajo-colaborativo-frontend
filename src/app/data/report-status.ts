import { ReportStatus } from './models';

export const MAIN_STATUS_STEPS: { id: ReportStatus; label: string }[] = [
  { id: 'reportada', label: 'Reportada' },
  { id: 'validada', label: 'Validada' },
  { id: 'asignada', label: 'Asignada' },
  { id: 'en_progreso', label: 'En progreso' },
  { id: 'en_validacion', label: 'En validación' },
  { id: 'resuelta', label: 'Resuelta' },
  { id: 'cerrada', label: 'Cerrada' },
];

const LABELS: Record<ReportStatus, string> = {
  reportada: 'Reportada',
  validada: 'Validada',
  asignada: 'Asignada',
  en_progreso: 'En progreso',
  en_validacion: 'En validación',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  bloqueada: 'Bloqueada',
  reabierta: 'Reabierta',
};

export function statusLabel(status: ReportStatus): string {
  return LABELS[status];
}

export function isExceptionStatus(status: ReportStatus): boolean {
  return status === 'bloqueada' || status === 'reabierta';
}
