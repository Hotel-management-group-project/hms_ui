// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';
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

  /** Look up checked-in bookings by reference number — backend filters by reference, client filters by status */
  findCheckedIn(referenceNumber: string): Observable<Booking[]> {
    const params = new HttpParams().set('referenceNumber', referenceNumber);
    return this.http.get<Booking[]>(this.bookingsApi, { params }).pipe(
      map(bookings => bookings.filter(b => b.status === 'CheckedIn'))
    );
  }

  /** Download invoice for a booking */
  downloadInvoice(bookingId: string): Observable<Blob> {
    return this.http.get(`${this.bookingsApi}/${bookingId}/invoice`, { responseType: 'blob' });
  }
}
