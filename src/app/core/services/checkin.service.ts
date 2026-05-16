
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';
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

  /** Look up a booking by reference number — filters client-side; backend GetAll ignores referenceNumber param */
  findByReference(referenceNumber: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.bookingsApi).pipe(
      map(bookings => bookings.filter(b =>
        b.referenceNumber.toLowerCase().includes(referenceNumber.toLowerCase())
      ))
    );
  }
}
