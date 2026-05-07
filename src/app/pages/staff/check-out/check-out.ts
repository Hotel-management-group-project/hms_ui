// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CheckOutService } from '../../../core/services/checkout.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Booking } from '../../../core/models';

@Component({
  selector: 'app-check-out',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './check-out.html',
})
export class CheckOutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private checkOutService = inject(CheckOutService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly confirming = signal(false);
  readonly checkedOut = signal(false);
  readonly booking = signal<Booking | null>(null);
  readonly error = signal<string | null>(null);

  readonly refForm = this.fb.group({
    referenceNumber: ['', [Validators.required, Validators.pattern(/^HMS-\d{4}-\d{5}$/)]]
  });

  readonly nights = computed(() => {
    const b = this.booking();
    if (!b) return 0;
    return Math.max(1, Math.ceil(
      (new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86400000
    ));
  });

  readonly isPeak = computed(() => {
    const b = this.booking();
    if (!b) return false;
    const month = new Date(b.checkInDate).getMonth() + 1;
    return [6, 7, 8, 12].includes(month);
  });

  readonly roomSubtotal = computed(() => {
    const b = this.booking();
    if (!b || !b.rooms || b.rooms.length === 0) return 0;
    return b.rooms.reduce((sum, r) => {
      const rate = this.isPeak() ? r.pricePeak : r.priceOffPeak;
      return sum + rate * this.nights();
    }, 0);
  });

  readonly ancillarySubtotal = computed(() => {
    const b = this.booking();
    if (!b?.ancillaryServices) return 0;
    return b.ancillaryServices.reduce((sum: number, s) => sum + s.totalPrice, 0);
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const ref = params.get('ref');
      if (ref) {
        this.refForm.patchValue({ referenceNumber: ref });
        this.findBooking();
      }
    });
  }

  findBooking(): void {
    if (this.refForm.invalid) {
      this.refForm.markAllAsTouched();
      return;
    }

    const ref = this.refForm.value.referenceNumber!.toUpperCase().trim();
    this.loading.set(true);
    this.booking.set(null);
    this.error.set(null);
    this.checkedOut.set(false);

    this.checkOutService.findCheckedIn(ref).subscribe({
      next: (bookings) => {
        this.loading.set(false);
        const match = bookings.find(b => b.referenceNumber === ref);
        if (match) {
          this.booking.set(match);
        } else {
          this.error.set('No checked-in booking found with that reference. Ensure the guest has already checked in.');
        }
      },
      error: (err: unknown) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('Failed to look up booking. Please try again.');
      }
    });
  }

  confirmCheckOut(): void {
    const b = this.booking();
    if (!b) return;

    this.confirming.set(true);
    this.checkOutService.confirmCheckOut(b.id).subscribe({
      next: () => {
        this.confirming.set(false);
        this.checkedOut.set(true);
        this.toast.success(`Check-out confirmed for ${b.referenceNumber}.`);
        this.booking.update(bk => bk ? { ...bk, status: 'CheckedOut' } : bk);
      },
      error: (err: unknown) => {
        console.error(err);
        this.confirming.set(false);
        this.toast.error('Check-out failed. Please try again.');
      }
    });
  }

  downloadInvoice(): void {
    const b = this.booking();
    if (!b) return;
    this.toast.info('Preparing invoice...');
    this.checkOutService.downloadInvoice(b.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${b.referenceNumber}.pdf`;
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

  statusClass(status: string): string {
    return {
      Confirmed:  'text-blue-400 border-blue-400/20 bg-blue-400/10',
      CheckedIn:  'text-green-400 border-green-400/20 bg-green-400/10',
      CheckedOut: 'text-cream-300 border-navy-600 bg-navy-700',
      Pending:    'text-amber-400 border-amber-400/20 bg-amber-400/10',
      Cancelled:  'text-red-400 border-red-400/20 bg-red-400/10',
    }[status] ?? 'text-cream-300 border-navy-600 bg-navy-700';
  }
}
