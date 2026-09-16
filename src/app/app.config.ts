import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth/auth.interceptor';
import { AuthService } from './auth/auth.service';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  LucideCamera,
  LucideChevronDown,
  LucideClipboardList,
  LucideHouse,
  LucideLink,
  LucideLogOut,
  LucidePanelLeft,
  LucidePencil,
  LucideTrash2,
  LucideUpload,
  LucideUsers,
  LucideX,
  provideLucideConfig,
  provideLucideIcons,
} from '@lucide/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideLucideIcons(
      LucideHouse,
      LucideUsers,
      LucideLogOut,
      LucidePanelLeft,
      LucideClipboardList,
      LucideChevronDown,
      LucideLink,
      LucideUpload,
      LucideCamera,
      LucidePencil,
      LucideTrash2,
      LucideX,
    ),
    provideLucideConfig({
      size: 18,
      strokeWidth: 1.75,
      color: 'currentColor',
    }),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return firstValueFrom(auth.bootstrapSession());
    }),
  ],
};
