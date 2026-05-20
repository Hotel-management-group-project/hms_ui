// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/components/toast/toast';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 is handled by jwtInterceptor (silent refresh), skip here
      if (err.status === 403) {
        toast.error('You do not have permission to perform this action.');
        router.navigate(['/']);
      }
      if (err.status === 0) {
        toast.error('Unable to connect to the server. Please check your connection.');
      }
      if (err.status >= 500) {
        toast.error('An unexpected server error occurred. Please try again later.');
      }
      return throwError(() => err);
    }),
  );
};
