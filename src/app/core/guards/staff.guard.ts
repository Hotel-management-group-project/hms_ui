import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Allows FrontDesk, Manager, and Admin roles.
 * Guests are redirected to their search page; unauthenticated users to login.
 */
export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  if (auth.hasRole('FrontDesk', 'Manager', 'Admin')) return true;
  return router.createUrlTree([auth.getRoleDashboard()]);
};
