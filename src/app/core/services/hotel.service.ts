// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Hotel } from '../models';

export interface CreateHotelRequest {
  name: string;
  location: string;
  address: string;
  description?: string;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class HotelService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/hotels`;

  getHotels(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(this.api);
  }

  create(data: CreateHotelRequest): Observable<Hotel> {
    return this.http.post<Hotel>(this.api, data);
  }

  update(id: string, data: Partial<Hotel>): Observable<Hotel> {
    return this.http.put<Hotel>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
