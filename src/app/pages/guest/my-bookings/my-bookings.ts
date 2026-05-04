// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
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

  readonly bookingToCancel = signal<Booking | null>(null);
  readonly isCancelling = signal(false);

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
      }
    });
  }

  setTab(tab: 'upcoming' | 'past') {
    this.currentTab.set(tab);
  }

  // 14 days = 1209600000 ms
  // 72 hours = 259200000 ms
  calculateCancellationFee(booking: Booking): { fee: number; message: string } {
    const checkIn = new Date(booking.checkInDate).getTime();
    const now = Date.now();
    const diff = checkIn - now;
    
    if (diff > 1209600000) {
      return { fee: 0, message: 'Free cancellation (more than 14 days prior to check-in).' };
    } else if (diff > 259200000) {
      return { fee: booking.totalPrice * 0.5, message: '50% fee applies (between 3 and 14 days prior to check-in).' };
    } else {
      return { fee: booking.totalPrice, message: '100% fee applies (less than 72 hours prior to check-in).' };
    }
  }

  confirmCancellation(booking: Booking) {
    this.bookingToCancel.set(booking);
  }

  closeCancelModal() {
    this.bookingToCancel.set(null);
  }

  proceedWithCancellation() {
    const b = this.bookingToCancel();
    if (!b) return;

    this.isCancelling.set(true);
    this.bookingService.cancelBooking(b.id).subscribe({
      next: () => {
        this.toast.success('Booking cancelled successfully.');
        this.isCancelling.set(false);
        this.closeCancelModal();
        this.fetchBookings();
      },
      error: (err: unknown) => {
        console.error(err);
        this.toast.error('Failed to cancel booking.');
        this.isCancelling.set(false);
      }
    });
  }

  downloadInvoice(bookingId: string) {
    this.toast.success('Downloading invoice...');
    this.bookingService.downloadInvoice(bookingId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: unknown) => {
        console.error(err);
        this.toast.error('Failed to download invoice.');
      }
    });
  }
}
