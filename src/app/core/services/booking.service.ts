// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Booking } from '../models';

export interface CreateBookingDto {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  roomIds: string[];
  ancillaryServices?: { serviceId: string; quantity: number }[];
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/bookings`;

  /** Get all bookings (for guest this returns own bookings due to backend auth) */
  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.api);
  }

  /** Get a specific booking */
  getBooking(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.api}/${id}`);
  }

  /** Create a new booking */
  createBooking(data: CreateBookingDto): Observable<Booking> {
    return this.http.post<Booking>(this.api, data);
  }

  /** Cancel a booking (returns cancellation fee logic from backend if applicable) */
  cancelBooking(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  /** Get the QR code URL for check-in */
  getQrCode(id: string): Observable<{ qrCodeUrl: string }> {
    return this.http.get<{ qrCodeUrl: string }>(`${this.api}/${id}/qr`);
  }

  /** Download invoice as PDF (Blob) */
  downloadInvoice(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/${id}/invoice`, { responseType: 'blob' });
  }
}
