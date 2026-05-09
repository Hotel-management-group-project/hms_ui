// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Room, RoomSearchQuery } from '../models';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/rooms`;

  /** Get rooms based on search criteria */
  search(query: RoomSearchQuery): Observable<Room[]> {
    let params = new HttpParams();
    if (query.hotelId)  params = params.set('hotelId',  query.hotelId);
    if (query.type)     params = params.set('type',     query.type);
    if (query.capacity) params = params.set('capacity', query.capacity.toString());
    if (query.checkIn)  params = params.set('checkIn',  query.checkIn);
    if (query.checkOut) params = params.set('checkOut', query.checkOut);

    if (query.checkIn && query.checkOut) {
      return this.http.get<Room[]>(`${this.api}/availability`, { params });
    }

    return this.http.get<Room[]>(this.api, { params });
  }

  /** Get a single room by ID */
  getById(id: string): Observable<Room> {
    return this.http.get<Room>(`${this.api}/${id}`);
  }

  /** Check availability for a specific hotel and date range */
  checkAvailability(hotelId: string, checkIn: string, checkOut: string): Observable<Room[]> {
    const iso = (d: string) => d.includes('T') ? d : `${d}T00:00:00`;
    let params = new HttpParams()
      .set('hotelId', hotelId)
      .set('checkIn', iso(checkIn))
      .set('checkOut', iso(checkOut));
    return this.http.get<Room[]>(`${this.api}/availability`, { params });
  }

  // Admin/Staff endpoints
  create(data: Partial<Room>): Observable<Room> {
    return this.http.post<Room>(this.api, data);
  }

  update(id: string, data: Partial<Room>): Observable<Room> {
    return this.http.put<Room>(`${this.api}/${id}`, data);
  }
}
