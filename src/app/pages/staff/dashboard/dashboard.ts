// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OccupancyService } from '../../../core/services/occupancy.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-staff-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  readonly occupancy = inject(OccupancyService);
  readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.occupancy.connect();
  }

  ngOnDestroy(): void {
    this.occupancy.disconnect();
  }

  get today(): string {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  statusClass(status: string): string {
    return {
      Confirmed: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
      CheckedIn: 'text-green-400 border-green-400/20 bg-green-400/10',
      CheckedOut: 'text-cream-300 border-navy-600 bg-navy-700',
      Pending: 'text-amber-400 border-amber-400/20 bg-amber-400/10',
      Cancelled: 'text-red-400 border-red-400/20 bg-red-400/10',
    }[status] ?? 'text-cream-300 border-navy-600 bg-navy-700';
  }
}
