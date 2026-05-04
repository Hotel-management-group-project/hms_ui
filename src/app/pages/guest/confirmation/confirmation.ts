// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models';
import { ToastService } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-confirmation',
  imports: [RouterLink],
  templateUrl: './confirmation.html',
})
export class ConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private toast = inject(ToastService);

  readonly booking = signal<Booking | null>(null);
  readonly qrCodeUrl = signal<string>('');
  readonly loading = signal(true);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('bookingId');
      if (id) {
        this.fetchDetails(id);
      }
    });
  }

  private fetchDetails(id: string) {
    this.bookingService.getBooking(id).subscribe({
      next: (b) => {
        this.booking.set(b);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.toast.error('Could not load booking details.');
        this.loading.set(false);
      }
    });

    this.bookingService.getQrCode(id).subscribe({
      next: (res) => this.qrCodeUrl.set(res.qrCodeUrl),
      error: (err: unknown) => console.error('Failed to load QR', err)
    });
  }
}
