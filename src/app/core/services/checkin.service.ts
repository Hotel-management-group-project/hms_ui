
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Booking } from '../models';

export interface QrScanRequest {
  referenceNumber: string;
}

export interface CheckInResponse {
  booking: Booking;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CheckInService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/checkin`;
  private bookingsApi = `${environment.apiUrl}/api/bookings`;

  /** Scan a QR code and get the associated booking */
  scanQr(referenceNumber: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.api}/scan`, { referenceNumber });
  }

  /** Confirm check-in for a booking */
  confirmCheckIn(bookingId: string): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(`${this.api}/${bookingId}`, {});
  }

  /** Look up a booking by reference number — backend filters server-side via ?referenceNumber= */
  findByReference(referenceNumber: string): Observable<Booking[]> {
    const params = new HttpParams().set('referenceNumber', referenceNumber);
    return this.http.get<Booking[]>(this.bookingsApi, { params });
  }
}
