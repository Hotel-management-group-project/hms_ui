// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface DashboardSummary {
  occupancyRate: number;
  revenueToday: number;
  arrivalsToday: number;
  departuresToday: number;
  totalRooms: number;
  occupiedRooms: number;
}

export interface OccupancyDataPoint {
  period: string;
  occupancyRate: number;
  totalRooms: number;
  occupied: number;
}

export interface RevenueDataPoint {
  period: string;
  revenue: number;
  bookingCount: number;
}

export interface DemographicItem {
  label: string;
  value: number;
  percentage: number;
}

export type ReportPeriod = 'daily' | 'monthly' | 'yearly';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/reports`;

  getSummary(hotelId?: string): Observable<DashboardSummary> {
    let params = new HttpParams();
    if (hotelId) params = params.set('hotelId', hotelId);
    return this.http.get<DashboardSummary>(`${this.api}/summary`, { params });
  }

  getOccupancy(period: ReportPeriod, hotelId?: string, from?: string, to?: string): Observable<OccupancyDataPoint[]> {
    let params = new HttpParams().set('period', period);
    if (hotelId) params = params.set('hotelId', hotelId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<OccupancyDataPoint[]>(`${this.api}/occupancy`, { params });
  }

  getRevenue(period: ReportPeriod, hotelId?: string, from?: string, to?: string): Observable<RevenueDataPoint[]> {
    let params = new HttpParams().set('period', period);
    if (hotelId) params = params.set('hotelId', hotelId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<RevenueDataPoint[]>(`${this.api}/revenue`, { params });
  }

  getDemographics(hotelId?: string): Observable<DemographicItem[]> {
    let params = new HttpParams();
    if (hotelId) params = params.set('hotelId', hotelId);
    return this.http.get<DemographicItem[]>(`${this.api}/demographics`, { params });
  }

  exportReport(type: 'pdf' | 'excel', period: ReportPeriod, hotelId?: string): Observable<Blob> {
    let params = new HttpParams().set('type', type).set('period', period);
    if (hotelId) params = params.set('hotelId', hotelId);
    return this.http.get(`${this.api}/export`, { params, responseType: 'blob' });
  }
}
