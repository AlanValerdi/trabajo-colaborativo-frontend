import { computed, Injectable, signal } from '@angular/core';
import { ROLES, USERS } from '../data/mock-seed';
import { Role, RoleSlug, User } from '../data/models';

const ROLE_USER_ID: Record<RoleSlug, string> = {
  reportante: 'usr-ana',
  tecnico: 'usr-carlos',
  responsable: 'usr-miguel',
  coordinador: 'usr-sofia',
  validador: 'usr-elena',
  administrador: 'usr-admin',
};

@Injectable({ providedIn: 'root' })
export class RoleSessionService {
  private readonly roleSlug = signal<RoleSlug>('reportante');

  readonly currentSlug = this.roleSlug.asReadonly();

  readonly currentRole = computed<Role>(() => {
    const slug = this.roleSlug();
    return ROLES.find((role) => role.slug === slug) ?? ROLES[0];
  });

  readonly currentUser = computed<User>(() => {
    const id = ROLE_USER_ID[this.roleSlug()];
    return USERS.find((user) => user.id === id) ?? USERS[0];
  });

  setRole(slug: RoleSlug): void {
    this.roleSlug.set(slug);
  }
}
