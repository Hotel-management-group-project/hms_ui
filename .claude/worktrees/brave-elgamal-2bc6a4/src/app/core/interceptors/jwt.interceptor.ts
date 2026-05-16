import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Track whether a refresh is already in flight to avoid duplicate calls. */
let isRefreshing = false;

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // Public auth endpoints that must never carry a token (they ARE the auth flow)
  const isPublicAuth = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh-token', '/api/auth/logout']
    .some(path => req.url.includes(path));

  // Any /api/auth/ endpoint — authenticated ones (e.g. change-password) get the
  // token but must not trigger a silent refresh if they return 401
  const isAuthEndpoint = req.url.includes('/api/auth/');

  const token = auth.getToken();
  if (token && !isPublicAuth) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Only attempt silent refresh on 401 for non-auth endpoints
      if (err.status === 401 && !isAuthEndpoint && !isRefreshing) {
        isRefreshing = true;
        return auth.refreshToken().pipe(
          switchMap(res => {
            isRefreshing = false;
            // Retry the original request with the new token
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${res.token}` },
            });
            return next(retried);
          }),
          catchError(refreshErr => {
            isRefreshing = false;
            auth.logout();
            return throwError(() => refreshErr);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
