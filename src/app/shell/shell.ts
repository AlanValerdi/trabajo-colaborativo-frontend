import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreadcrumbService } from '../session/breadcrumb.service';
import { RoleSessionService } from '../session/role-session.service';
import { AuthService } from '../auth/auth.service';
import { roleBySlug, roleSlugFromBackend } from '../data/roles';
import { HomeSearchService } from '../session/home-search.service';
import {
  LucideChevronDown,
  LucideClipboardList,
  LucideHouse,
  LucideLogOut,
  LucidePanelLeft,
  LucideUsers,
} from '@lucide/angular';

const MOBILE_QUERY = '(max-width: 860px)';
const SEARCH_MOBILE_QUERY = '(max-width: 700px)';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideHouse,
    LucideUsers,
    LucideLogOut,
    LucidePanelLeft,
    LucideClipboardList,
    LucideChevronDown,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly roles = inject(RoleSessionService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly crumbs = inject(BreadcrumbService);
  protected readonly authService = inject(AuthService);
  protected readonly homeSearch = inject(HomeSearchService);

  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly isSearchMobile = signal(false);
  protected readonly roleMenuOpen = signal(false);
  protected readonly currentRole = this.roles.currentRole;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly searchQuery = this.homeSearch.query;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly showTopbarSearch = computed(() => {
    const url = this.currentUrl();
    return this.isSearchMobile() && (url === '/inicio' || url.startsWith('/inicio/comunidad'));
  });

  protected readonly availableRoles = computed(() => {
    const profile = this.authService.currentUser();
    if (!profile?.role) {
      return [];
    }
    return [roleBySlug(roleSlugFromBackend(profile.role))];
  });

  protected readonly showSidebarLabels = computed(() => this.isMobile() || !this.collapsed());

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.roleMenuOpen.set(false);
        this.mobileOpen.set(false);
        const url = (event as NavigationEnd).urlAfterRedirects;
        if (!url.startsWith('/inicio')) {
          this.homeSearch.clear();
        }
      });

    if (typeof window !== 'undefined') {
      this.isMobile.set(window.matchMedia(MOBILE_QUERY).matches);
      this.isSearchMobile.set(window.matchMedia(SEARCH_MOBILE_QUERY).matches);
    }

    afterNextRender(() => {
      const mobileQuery = window.matchMedia(MOBILE_QUERY);
      const searchMobileQuery = window.matchMedia(SEARCH_MOBILE_QUERY);

      const syncMobile = (event?: MediaQueryListEvent) => {
        const mobile = event?.matches ?? mobileQuery.matches;
        this.isMobile.set(mobile);
        if (event && mobile) {
          this.mobileOpen.set(false);
        }
      };

      const syncSearchMobile = (event?: MediaQueryListEvent) => {
        this.isSearchMobile.set(event?.matches ?? searchMobileQuery.matches);
      };

      syncMobile();
      syncSearchMobile();
      mobileQuery.addEventListener('change', syncMobile);
      searchMobileQuery.addEventListener('change', syncSearchMobile);
      this.destroyRef.onDestroy(() => {
        mobileQuery.removeEventListener('change', syncMobile);
        searchMobileQuery.removeEventListener('change', syncSearchMobile);
      });
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
    if (this.availableRoles().length <= 1) {
      return;
    }
    this.roleMenuOpen.update((value) => !value);
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected onTopbarSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.homeSearch.setQuery(value);
  }

  protected initials(name: string | undefined | null): string {
    if (!name) return '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
}
