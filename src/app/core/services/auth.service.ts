// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type UserRole = 'Guest' | 'FrontDesk' | 'Manager' | 'Admin';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/auth`;

  readonly currentUser = signal<AuthUser | null>(null);

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser();
    return user !== null && roles.includes(user.role);
  }
}
