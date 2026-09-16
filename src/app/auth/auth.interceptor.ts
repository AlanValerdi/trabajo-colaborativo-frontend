import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

function shouldSkipRefresh(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        shouldSkipRefresh(req.url) ||
        req.headers.has('X-Retry-After-Refresh')
      ) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((newToken) =>
          next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
                'X-Retry-After-Refresh': 'true',
              },
            }),
          ),
        ),
        catchError((refreshError) => throwError(() => refreshError)),
      );
    }),
  );
};
