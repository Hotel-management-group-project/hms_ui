// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface AuditLog {
  id: number;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  details: string | null;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/auditlogs`;

  getLogs(
    page = 1,
    limit = 20,
    action?: string,
    userId?: string,
    from?: string,
    to?: string,
  ): Observable<PagedResult<AuditLog>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', limit.toString());
    if (action) params = params.set('action', action);
    if (userId) params = params.set('userId', userId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<PagedResult<AuditLog>>(this.api, { params });
  }
}
