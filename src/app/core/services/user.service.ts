// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { User, UserRole } from '../models';

export interface CreateStaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'FrontDesk' | 'Manager';
  phoneNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/users`;

  getAll(role?: UserRole): Observable<User[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<User[]>(this.api, { params });
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`);
  }

  create(data: CreateStaffRequest): Observable<User> {
    return this.http.post<User>(this.api, data);
  }

  updateProfile(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, data);
  }

  setActive(id: string, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${this.api}/${id}/active`, { isActive });
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/auth/change-password`, data);
  }
}
