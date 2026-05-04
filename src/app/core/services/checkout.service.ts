// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Booking } from '../models';

export interface CheckOutResponse {
  booking: Booking;
  finalAmount: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CheckOutService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/checkout`;
  private bookingsApi = `${environment.apiUrl}/api/bookings`;

  /** Confirm checkout for a booking */
  confirmCheckOut(bookingId: string): Observable<CheckOutResponse> {
    return this.http.post<CheckOutResponse>(`${this.api}/${bookingId}`, {});
  }

  /** Look up a checked-in booking by reference number */
  findCheckedIn(referenceNumber: string): Observable<Booking[]> {
    const params = new HttpParams()
      .set('referenceNumber', referenceNumber)
      .set('status', 'CheckedIn');
    return this.http.get<Booking[]>(this.bookingsApi, { params });
  }

  /** Download invoice for a booking */
  downloadInvoice(bookingId: string): Observable<Blob> {
    return this.http.get(`${this.bookingsApi}/${bookingId}/invoice`, { responseType: 'blob' });
  }
}
