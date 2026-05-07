// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuditLogService, AuditLog } from '../../../core/services/audit-log.service';

const ACTIONS = ['Login', 'Logout', 'BookingCreated', 'BookingCancelled', 'CheckIn', 'CheckOut', 'PaymentProcessed', 'PasswordChanged', 'UserCreated', 'UserDeactivated'];

@Component({
  selector: 'app-audit-logs',
  imports: [FormsModule, DatePipe],
  templateUrl: './audit-logs.html',
})
export class AuditLogsComponent implements OnInit {
  private auditLogService = inject(AuditLogService);

  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  // Filters
  filterAction = '';
  filterUser = '';
  filterFrom = '';
  filterTo = '';

  // Pagination
  readonly page = signal(1);
  readonly total = signal(0);
  readonly limit = 20;

  readonly actions = ACTIONS;

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(resetPage = false): void {
    if (resetPage) this.page.set(1);
    this.loading.set(true);
    this.error.set('');

    this.auditLogService.getLogs(
      this.page(),
      this.limit,
      this.filterAction || undefined,
      this.filterUser || undefined,
      this.filterFrom || undefined,
      this.filterTo || undefined,
    ).subscribe({
      next: result => {
        this.logs.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load audit logs.'); this.loading.set(false); },
    });
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update(p => p - 1);
    this.loadLogs();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages) return;
    this.page.update(p => p + 1);
    this.loadLogs();
  }

  clearFilters(): void {
    this.filterAction = '';
    this.filterUser = '';
    this.filterFrom = '';
    this.filterTo = '';
    this.loadLogs(true);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  get pageStart(): number {
    return (this.page() - 1) * this.limit + 1;
  }

  get pageEnd(): number {
    return Math.min(this.page() * this.limit, this.total());
  }

  actionClass(action: string): string {
    if (action.startsWith('Login') || action.startsWith('Logout')) return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
    if (action.includes('Booking')) return 'text-gold-400 border-gold-400/20 bg-gold-400/10';
    if (action.includes('CheckIn') || action.includes('CheckOut')) return 'text-green-400 border-green-400/20 bg-green-400/10';
    if (action.includes('Payment')) return 'text-purple-400 border-purple-400/20 bg-purple-400/10';
    if (action.includes('Password') || action.includes('User')) return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
    return 'text-ink-2/60 border-rim-2 bg-raised';
  }
}
