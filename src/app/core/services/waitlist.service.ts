// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Waitlist } from '../models';

export interface WaitlistRequest {
  hotelId: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
}

@Injectable({ providedIn: 'root' })
export class WaitlistService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/waitlist`;

  /** Join the waitlist for a fully booked room type */
  joinWaitlist(data: WaitlistRequest): Observable<Waitlist> {
    return this.http.post<Waitlist>(this.api, data);
  }

  /** Staff endpoint: get current waitlist */
  getWaitlist(): Observable<Waitlist[]> {
    return this.http.get<Waitlist[]>(this.api);
  }
}
