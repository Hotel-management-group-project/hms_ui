// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Booking } from '../../../core/models';

@Component({
  selector: 'app-my-bookings',
  imports: [RouterLink],
  templateUrl: './my-bookings.html',
})
export class MyBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private toast = inject(ToastService);

  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly currentTab = signal<'upcoming' | 'past'>('upcoming');

  // Cancel modal
  readonly bookingToCancel = signal<Booking | null>(null);
  readonly isCancelling = signal(false);

  // QR modal
  readonly qrModalBooking = signal<Booking | null>(null);
  readonly qrCodeUrl = signal('');
  readonly loadingQr = signal(false);

  readonly upcomingBookings = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return this.bookings()
      .filter(b => new Date(b.checkInDate) >= now && b.status !== 'Cancelled')
      .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
  });

  readonly pastBookings = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return this.bookings()
      .filter(b => new Date(b.checkInDate) < now || b.status === 'Cancelled')
      .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
  });

  ngOnInit() {
    this.fetchBookings();
  }

  fetchBookings() {
    this.loading.set(true);
    this.bookingService.getMyBookings().subscribe({
      next: (data) => {
        this.bookings.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.toast.error('Failed to load bookings.');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: 'upcoming' | 'past') { this.currentTab.set(tab); }

  // ── QR Modal ──────────────────────────────────────────────
  viewQr(b: Booking) {
    this.qrModalBooking.set(b);
    this.qrCodeUrl.set('');

    if (b.qrCodeUrl) {
      this.qrCodeUrl.set(b.qrCodeUrl);
      return;
    }

    this.loadingQr.set(true);
    this.bookingService.getQrCode(b.id).subscribe({
      next: (res) => { this.qrCodeUrl.set(res.qrCodeUrl); this.loadingQr.set(false); },
      error: (err: unknown) => {
        console.error(err);
        this.loadingQr.set(false);
        this.toast.warning('QR code not yet available — booking may still be pending.');
      },
    });
  }

  closeQrModal() {
    this.qrModalBooking.set(null);
    this.qrCodeUrl.set('');
  }

  // ── Cancel Modal ──────────────────────────────────────────
  private getFirstNightPrice(booking: Booking): number {
    const room = booking.rooms?.[0];
    if (room) return room.pricePerNight;
    const nights = Math.max(1, Math.ceil(
      (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86400000
    ));
    return booking.totalPrice / nights;
  }

  calculateCancellationFee(booking: Booking): { fee: number; label: string; severity: 'green' | 'amber' | 'red' } {
    const diff = new Date(booking.checkInDate).getTime() - Date.now();
    const firstNight = Math.round(this.getFirstNightPrice(booking));

    if (diff > 1_209_600_000) {
      return { fee: 0, label: 'Free cancellation — more than 14 days before check-in.', severity: 'green' };
    } else if (diff > 259_200_000) {
      return { fee: Math.round(firstNight * 0.5), label: '50% of first night applies — 3 to 14 days before check-in.', severity: 'amber' };
    } else {
      return { fee: firstNight, label: '100% of first night applies — less than 72 hours before check-in.', severity: 'red' };
    }
  }

  confirmCancellation(booking: Booking) { this.bookingToCancel.set(booking); }
  closeCancelModal() { this.bookingToCancel.set(null); }

  proceedWithCancellation() {
    const b = this.bookingToCancel();
    if (!b) return;

    this.isCancelling.set(true);
    this.bookingService.cancelBooking(b.id).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.toast.success('Booking cancelled successfully.');
        this.closeCancelModal();
        this.fetchBookings();
      },
      error: (err: unknown) => {
        console.error(err);
        this.toast.error('Failed to cancel booking.');
        this.isCancelling.set(false);
      },
    });
  }

  downloadInvoice(bookingId: string) {
    this.toast.info('Preparing invoice…');
    this.bookingService.downloadInvoice(bookingId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HMS-Invoice-${bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: unknown) => {
        console.error(err);
        this.toast.error('Failed to download invoice.');
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  statusClass(status: string): string {
    return {
      Confirmed:  'text-green-400 bg-green-400/10 border-green-400/25',
      Pending:    'text-amber-400 bg-amber-400/10 border-amber-400/25',
      CheckedIn:  'text-blue-400 bg-blue-400/10 border-blue-400/25',
      CheckedOut: 'text-ink-2 bg-raised border-rim-2',
      Cancelled:  'text-red-400 bg-red-400/10 border-red-400/25',
    }[status] ?? 'text-ink-2 bg-raised border-rim-2';
  }
}
