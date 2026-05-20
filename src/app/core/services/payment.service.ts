// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
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

export interface PaymentResponseDto {
  success: boolean;
  message: string;
  payment: Payment;
  bookingStatus: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/payments`;

  /** Process a payment (Mock gateway) */
  processPayment(data: PaymentRequest): Observable<PaymentResponseDto> {
    return this.http.post<PaymentResponseDto>(`${this.api}/process`, data);
  }

  /** Get payment status for a booking */
  getPaymentStatus(bookingId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.api}/${bookingId}`);
  }
}
