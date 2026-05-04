import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Allows only Admin role.
 * Other authenticated roles are redirected to their own dashboard.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  if (auth.hasRole('Admin')) return true;
  return router.createUrlTree([auth.getRoleDashboard()]);
};
