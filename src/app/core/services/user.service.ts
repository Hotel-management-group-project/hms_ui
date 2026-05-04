// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/users`;

  /** Update user profile. Guest uses this with their own ID. */
  updateProfile(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, data);
  }

  /** Change user password */
  changePassword(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/auth/change-password`, data);
  }
}
