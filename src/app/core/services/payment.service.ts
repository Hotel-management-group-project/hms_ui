// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Payment } from '../models';

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  method: string;
  cardName?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/payments`;

  /** Process a payment (Mock gateway) */
  processPayment(data: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.api}/process`, data);
  }

  /** Get payment status for a booking */
  getPaymentStatus(bookingId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.api}/${bookingId}`);
  }
}
