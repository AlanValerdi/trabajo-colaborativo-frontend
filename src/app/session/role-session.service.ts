import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { roleBySlug, roleSlugFromBackend } from '../data/roles';
import { Role, RoleSlug } from '../data/models';

@Injectable({ providedIn: 'root' })
export class RoleSessionService {
  private readonly auth = inject(AuthService);
  private readonly roleSlug = signal<RoleSlug>('reportante');

  readonly currentSlug = this.roleSlug.asReadonly();

  readonly currentRole = computed<Role>(() => roleBySlug(this.roleSlug()));

  constructor() {
    effect(() => {
      const profile = this.auth.currentUser();
      if (profile?.role) {
        this.roleSlug.set(roleSlugFromBackend(profile.role));
      }
    });
  }

  setRole(slug: RoleSlug): void {
    this.roleSlug.set(slug);
  }
}
