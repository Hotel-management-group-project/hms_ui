import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Allows Manager and Admin roles.
 * Other authenticated roles are redirected to their own dashboard.
 */
export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  if (auth.hasRole('Manager', 'Admin')) return true;
  return router.createUrlTree([auth.getRoleDashboard()]);
};
