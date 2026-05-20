// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Types ──────────────────────────────────────────────
export type UserRole = 'Guest' | 'FrontDesk' | 'Manager' | 'Admin';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  requiresPasswordChange: boolean;
}

// ── JWT payload shape (from backend) ───────────────────
interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  exp: number;
  iat: number;
}

// ── Service ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private api = `${environment.apiUrl}/api/auth`;

  // Reactive user state (Angular signals)
  readonly currentUser = signal<AuthUser | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() {
    // Restore session from stored token on app boot
    this.restoreSession();
  }

  // ── Public API ──────────────────────────────────────

  /** Log in with email + password. Stores JWT + user in localStorage. */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, credentials, { withCredentials: true })
      .pipe(
        tap(res => this.handleAuthSuccess(res)),
        catchError(err => throwError(() => err)),
      );
  }

  /** Register a new guest account. */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/register`, data, { withCredentials: true })
      .pipe(
        tap(res => this.handleAuthSuccess(res)),
        catchError(err => throwError(() => err)),
      );
  }

  /** Clear local state, call backend logout, redirect to login. */
  logout(): void {
    this.http
      .post(`${this.api}/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => {} }); // fire-and-forget
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /** Silently request a new access token using the HttpOnly refresh cookie. */
  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/refresh-token`, {}, { withCredentials: true })
      .pipe(
        tap(res => this.handleAuthSuccess(res)),
      );
  }

  // ── Guards / helpers ────────────────────────────────

  isAuthenticated(): boolean {
    if (!this.currentUser()) return false;
    const token = this.getToken();
    if (!token) return false;
    const payload = this.decodeToken(token);
    if (payload === null) return false;
    // If exp is missing, trust the token — the server will reject it if expired
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser();
    return user !== null && roles.includes(user.role);
  }

  getRole(): UserRole | null {
    return this.currentUser()?.role ?? null;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /** Return the dashboard path for the current user's role. */
  getRoleDashboard(): string {
    const role = this.getRole();
    switch (role) {
      case 'Admin':     return '/admin/dashboard';
      case 'Manager':   return '/manager/dashboard';
      case 'FrontDesk': return '/staff/dashboard';
      case 'Guest':
      default:          return '/guest/search';
    }
  }

  // ── Token utilities ─────────────────────────────────

  /** Decode a JWT without a library (base64url → JSON). */
  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      // Convert base64url → base64 and restore padding
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      const decoded = atob(padded);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }

  // ── Private helpers ─────────────────────────────────

  /** Persist token + user and update signal. */
  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('access_token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  /** Try to restore user from localStorage on startup. */
  private restoreSession(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) return;

    // Check token expiry
    const payload = this.decodeToken(token);
    if (!payload || payload.exp * 1000 <= Date.now()) {
      this.clearSession();
      return;
    }

    try {
      this.currentUser.set(JSON.parse(userJson) as AuthUser);
    } catch {
      this.clearSession();
    }
  }

  /** Wipe all auth state. */
  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }
}
