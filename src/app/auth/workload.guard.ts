import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
export const workloadGuard: CanActivateFn = () => {
  const roles = inject(AuthService).currentUser()?.roles ?? [];
  return roles.some(role => ['coordinador', 'responsable_area'].includes(role))
    || inject(Router).createUrlTree(['/inicio']);
};
