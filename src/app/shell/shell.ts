import { afterNextRender, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { RoleSlug } from '../data/models';
import { BreadcrumbService } from '../session/breadcrumb.service';
import { RoleSessionService } from '../session/role-session.service';
import { ReportsService } from '../data/reports.service';

const MOBILE_QUERY = '(max-width: 860px)';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly roles = inject(RoleSessionService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly reports = inject(ReportsService);
  protected readonly crumbs = inject(BreadcrumbService);

  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly roleMenuOpen = signal(false);
  protected readonly currentRole = this.roles.currentRole;
  protected readonly currentUser = this.roles.currentUser;
  protected readonly allRoles = this.reports.roles;
  protected readonly showSidebarLabels = computed(() => this.isMobile() || !this.collapsed());

  constructor() {
    let skip = true;
    effect(() => {
      this.roles.currentSlug();
      if (skip) {
        skip = false;
        return;
      }
      if (this.router.url.includes('/reportes/')) {
        void this.router.navigateByUrl('/inicio');
      }
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.roleMenuOpen.set(false);
        this.mobileOpen.set(false);
      });

    if (typeof window !== 'undefined') {
      this.isMobile.set(window.matchMedia(MOBILE_QUERY).matches);
    }

    afterNextRender(() => {
      const query = window.matchMedia(MOBILE_QUERY);
      const sync = (event?: MediaQueryListEvent) => {
        const mobile = event?.matches ?? query.matches;
        this.isMobile.set(mobile);
        if (event && mobile) {
          this.mobileOpen.set(false);
        }
      };
      sync();
      query.addEventListener('change', sync);
      this.destroyRef.onDestroy(() => query.removeEventListener('change', sync));
    });
  }

  protected toggleMenu(): void {
    this.roleMenuOpen.set(false);
    if (this.isMobile()) {
      this.mobileOpen.update((value) => !value);
    } else {
      this.collapsed.update((value) => !value);
    }
  }

  protected closeMobile(): void {
    this.mobileOpen.set(false);
    this.roleMenuOpen.set(false);
  }

  protected toggleRoleMenu(): void {
    this.roleMenuOpen.update((value) => !value);
  }

  protected selectRole(slug: RoleSlug): void {
    this.roles.setRole(slug);
    this.roleMenuOpen.set(false);
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
}
