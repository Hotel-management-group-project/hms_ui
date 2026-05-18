// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { TestBed } from '@angular/core/testing';
import {
  Router,
  provideRouter,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { staffGuard } from './staff.guard';
import { AuthService, UserRole } from '../services/auth.service';

describe('staffGuard', () => {
  let mockAuthService: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasRole: ReturnType<typeof vi.fn>;
    getRoleDashboard: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const applyRole = (role: UserRole | null) => {
    const authenticated = role !== null;
    const staffRoles: UserRole[] = ['FrontDesk', 'Manager', 'Admin'];

    mockAuthService.isAuthenticated.mockReturnValue(authenticated);
    mockAuthService.hasRole.mockImplementation((...roles: UserRole[]) =>
      authenticated && roles.some(r => role !== null && r === role && staffRoles.includes(r))
    );
    mockAuthService.getRoleDashboard.mockReturnValue(
      role === 'Guest' ? '/guest/search' : '/auth/login'
    );
  };

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      hasRole: vi.fn().mockReturnValue(false),
      getRoleDashboard: vi.fn().mockReturnValue('/guest/search'),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('blocks Guest role and redirects to the guest dashboard', () => {
    applyRole('Guest');

    const result = TestBed.runInInjectionContext(() =>
      staffGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/guest/search');
  });

  it('allows FrontDesk role through', () => {
    applyRole('FrontDesk');

    const result = TestBed.runInInjectionContext(() =>
      staffGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('allows Manager role through (Manager is a permitted staff role)', () => {
    applyRole('Manager');

    const result = TestBed.runInInjectionContext(() =>
      staffGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('redirects unauthenticated user to /auth/login', () => {
    applyRole(null);

    const result = TestBed.runInInjectionContext(() =>
      staffGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/auth/login');
  });
});
