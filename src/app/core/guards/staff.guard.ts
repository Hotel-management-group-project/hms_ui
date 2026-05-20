// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)
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
