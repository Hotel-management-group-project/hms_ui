// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import gsap from 'gsap';
import { UserService } from '../../../core/services/user.service';
import { HotelService } from '../../../core/services/hotel.service';
import { AuditLogService, AuditLog } from '../../../core/services/audit-log.service';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DatePipe, SlicePipe],
  templateUrl: './dashboard.html',
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private hotelService = inject(HotelService);
  private auditLogService = inject(AuditLogService);
  private reportService = inject(ReportService);

  readonly totalUsers = signal(0);
  readonly totalHotels = signal(0);
  readonly activeCheckIns = signal(0);
  readonly bookingsThisMonth = signal(0);
  readonly recentLogs = signal<AuditLog[]>([]);
  readonly loadingStats = signal(true);
  readonly loadingLogs = signal(true);

  readonly navLinks = [
    {
      path: '/admin/users',
      label: 'User Management',
      desc: 'Create & manage all accounts',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      color: 'text-blue-400',
      border: 'border-blue-400/20',
      bg: 'bg-blue-400/5',
    },
    {
      path: '/admin/hotels',
      label: 'Hotel Configuration',
      desc: 'Add, edit & manage hotel properties',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      color: 'text-gold-400',
      border: 'border-gold-400/20',
      bg: 'bg-gold-400/5',
    },
    {
      path: '/manager/audit-logs',
      label: 'Audit Logs',
      desc: 'System activity & security trail',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      color: 'text-purple-400',
      border: 'border-purple-400/20',
      bg: 'bg-purple-400/5',
    },
    {
      path: '/manager/reports',
      label: 'Reports & Analytics',
      desc: 'Revenue, occupancy & demographics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'text-green-400',
      border: 'border-green-400/20',
      bg: 'bg-green-400/5',
    },
  ];

  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from('.gsap-stat-card', {
        y: 24, opacity: 0, duration: 0.55, stagger: 0.1, ease: 'power2.out', clearProps: 'all',
      });
      gsap.from('.gsap-nav-card', {
        y: 16, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.45, clearProps: 'all',
      });
    });
  }

  ngOnInit(): void {
    this.userService.getAll().subscribe({
      next: users => { this.totalUsers.set(users.length); this.loadingStats.set(false); },
      error: () => this.loadingStats.set(false),
    });

    this.hotelService.getHotels().subscribe({
      next: hotels => this.totalHotels.set(hotels.length),
    });

    this.reportService.getSummary().subscribe({
      next: s => this.activeCheckIns.set(s.occupiedRooms),
    });

    this.reportService.getRevenue('monthly').subscribe({
      next: data => this.bookingsThisMonth.set(data.reduce((sum, d) => sum + d.bookingCount, 0)),
    });

    this.auditLogService.getLogs(1, 10).subscribe({
      next: result => { this.recentLogs.set(result.items); this.loadingLogs.set(false); },
      error: () => this.loadingLogs.set(false),
    });
  }

  get today(): string {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  actionClass(action: string): string {
    if (action.startsWith('Login') || action.startsWith('Logout')) return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
    if (action.includes('Booking')) return 'text-gold-400 border-gold-400/20 bg-gold-400/10';
    if (action.includes('CheckIn') || action.includes('CheckOut')) return 'text-green-400 border-green-400/20 bg-green-400/10';
    if (action.includes('Payment')) return 'text-purple-400 border-purple-400/20 bg-purple-400/10';
    if (action.includes('Password') || action.includes('User')) return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
    return 'text-cream-300/60 border-navy-600 bg-navy-700';
  }
}
