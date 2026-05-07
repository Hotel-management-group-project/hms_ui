// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AncillaryService } from '../models';

@Injectable({ providedIn: 'root' })
export class AncillaryServiceService {
  private http = inject(HttpClient);
  protected api = `${environment.apiUrl}/api/ancillaryservices`;

  /** Get all available ancillary services (e.g. Airport Transfer, Spa Access) */
  getAncillaryServices(): Observable<AncillaryService[]> {
    return this.http.get<AncillaryService[]>(this.api);
  }
}
