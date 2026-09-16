import { Role, RoleSlug } from './models';

export const ROLES: Role[] = [
  {
    id: 'rol-reportante',
    slug: 'reportante',
    name: 'Reportante',
    description: 'Reporta fallas y da seguimiento',
  },
  {
    id: 'rol-tecnico',
    slug: 'tecnico',
    name: 'Técnico',
    description: 'Diagnostica, atiende y documenta el trabajo',
  },
  {
    id: 'rol-responsable',
    slug: 'responsable',
    name: 'Responsable de área',
    description: 'Clasifica, prioriza y asigna técnicos',
  },
  {
    id: 'rol-coordinador',
    slug: 'coordinador',
    name: 'Coordinador de mantenimiento',
    description: 'Supervisa la operación global y redistribuye la carga',
  },
  {
    id: 'rol-validador',
    slug: 'validador',
    name: 'Validador',
    description: 'Confirma si la solución resolvió el problema',
  },
  {
    id: 'rol-administrador',
    slug: 'administrador',
    name: 'Administrador',
    description: 'Gestiona usuarios, roles, espacios y parámetros generales',
  },
];

export function roleSlugFromBackend(role: string): RoleSlug {
  if (role === 'responsable_area') {
    return 'responsable';
  }
  return role as RoleSlug;
}

export function roleBySlug(slug: RoleSlug): Role {
  return ROLES.find((item) => item.slug === slug) ?? ROLES[0];
}
