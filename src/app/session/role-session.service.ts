import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { roleBySlug, roleSlugFromBackend, rolesFromBackend } from '../data/roles';
import { Role, RoleSlug } from '../data/models';

const ACTIVE_ROLE_KEY = 'active_role_slug';

@Injectable({ providedIn: 'root' })
export class RoleSessionService {
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly roleSlug = signal<RoleSlug>('reportante');

  readonly currentSlug = this.roleSlug.asReadonly();

  readonly currentRole = computed<Role>(() => roleBySlug(this.roleSlug()));

  readonly availableRoles = computed<Role[]>(() => {
    const profile = this.auth.currentUser();
    if (!profile?.roles?.length) {
      return [];
    }
    return rolesFromBackend(profile.roles);
  });

  constructor() {
    effect(() => {
      const profile = this.auth.currentUser();
      if (!profile?.roles?.length) {
        return;
      }

      const allowed = profile.roles.map((role) => roleSlugFromBackend(role));
      const stored = this.readStoredSlug();
      const nextSlug =
        stored && allowed.includes(stored) ? stored : allowed[0] ?? 'reportante';

      this.roleSlug.set(nextSlug);
      this.persistSlug(nextSlug);
    });
  }

  setRole(slug: RoleSlug): void {
    const allowed = this.availableRoles().map((role) => role.slug);
    if (!allowed.includes(slug)) {
      return;
    }
    this.roleSlug.set(slug);
    this.persistSlug(slug);
  }

  private readStoredSlug(): RoleSlug | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const value = sessionStorage.getItem(ACTIVE_ROLE_KEY);
    return value ? (value as RoleSlug) : null;
  }

  private persistSlug(slug: RoleSlug): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    sessionStorage.setItem(ACTIVE_ROLE_KEY, slug);
  }
}
