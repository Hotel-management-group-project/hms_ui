
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { BookingService } from '../../../core/services/booking.service';
import { HotelService } from '../../../core/services/hotel.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Booking, Hotel } from '../../../core/models';

@Component({
  selector: 'app-confirmation',
  imports: [RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './confirmation.html',
})
export class ConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private hotelService = inject(HotelService);
  private toast = inject(ToastService);

  readonly booking = signal<Booking | null>(null);
  readonly hotel = signal<Hotel | null>(null);
  readonly qrCodeUrl = signal<string>('');
  readonly loading = signal(true);
  readonly downloading = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('bookingId');
      if (id) this.fetchDetails(id);
    });
  }

  private fetchDetails(id: string): void {
    this.bookingService.getBooking(id).subscribe({
      next: b => {
        this.booking.set(b);
        this.loading.set(false);
        this.loadHotel(b.hotelId);
      },
      error: () => {
        this.toast.error('Could not load booking details.');
        this.loading.set(false);
      },
    });

    this.bookingService.getQrCode(id).subscribe({
      next: res => this.qrCodeUrl.set(res.qrCodeUrl),
      error: () => {},
    });
  }

  private loadHotel(hotelId: string): void {
    this.hotelService.getHotels().subscribe({
      next: hotels => {
        const found = hotels.find(h => h.id === hotelId) ?? null;
        this.hotel.set(found);
      },
      error: () => {},
    });
  }

  downloadInvoice(): void {
    const b = this.booking();
    if (!b) return;
    this.downloading.set(true);
    this.toast.info('Preparing invoice…');
    this.bookingService.downloadInvoice(b.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HMS-Invoice-${b.referenceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => {
        this.toast.error('Failed to download invoice.');
        this.downloading.set(false);
      },
    });
  }

  get nights(): number {
    const b = this.booking();
    if (!b) return 0;
    const ms = new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }
}
