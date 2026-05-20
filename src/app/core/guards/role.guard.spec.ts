// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { managerGuard } from './manager.guard';
import { AuthService } from '../services/auth.service';

describe('managerGuard', () => {
  const authMock = {
    isAuthenticated: vi.fn(),
    hasRole: vi.fn(),
    getRoleDashboard: vi.fn(),
  };
  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getRoleDashboard.mockReturnValue('/guest/search');

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('RoleGuard_BlocksWrongRole', () => {
    // User is authenticated as Guest (wrong role for managerGuard)
    authMock.isAuthenticated.mockReturnValue(true);
    authMock.hasRole.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      managerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    // Should redirect to guest dashboard, not allow access
    expect(result.toString()).toBe(router.createUrlTree(['/guest/search']).toString());
  });

  it('RoleGuard_AllowsCorrectRole', () => {
    // User is authenticated as Manager (correct role)
    authMock.isAuthenticated.mockReturnValue(true);
    authMock.hasRole.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      managerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });
});
