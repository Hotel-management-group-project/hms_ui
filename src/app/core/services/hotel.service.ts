// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Hotel } from '../models';

@Injectable({ providedIn: 'root' })
export class HotelService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/hotels`;

  /** Get all hotels (used to populate location dropdowns) */
  getHotels(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(this.api);
  }
}
