import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const canActivate = (): boolean | ReturnType<Router['createUrlTree']> => {
    if (auth.isAuthenticated() && auth.currentUser()) {
      return true;
    }
    return router.createUrlTree(['/login']);
  };

  if (auth.sessionReady()) {
    return canActivate();
  }

  return toObservable(auth.sessionReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() => canActivate()),
  );
};
