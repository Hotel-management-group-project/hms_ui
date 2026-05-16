
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Booking } from '../../../core/models';

@Component({
  selector: 'app-payment',
  imports: [ReactiveFormsModule],
  templateUrl: './payment.html',
})
export class PaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private paymentService = inject(PaymentService);
  private bookingService = inject(BookingService);
  private toast = inject(ToastService);

  readonly bookingId = signal<string>('');
  readonly booking = signal<Booking | null>(null);
  readonly loading = signal(true);
  readonly processing = signal(false);

  readonly form = this.fb.group({
    cardName: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.pattern(/^[\d\s]{16,19}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('bookingId');
      if (!id) {
        this.router.navigate(['/guest/my-bookings']);
        return;
      }
      this.bookingId.set(id);
      
      this.bookingService.getBooking(id).subscribe({
        next: (b) => {
          this.booking.set(b);
          this.loading.set(false);
          // Auto-fill mock data for ease of testing
          this.form.patchValue({
            cardName: 'Jane Doe',
            cardNumber: '4111 1111 1111 1111',
            expiry: '12/26',
            cvv: '123'
          });
        },
        error: (err: unknown) => {
          console.error(err);
          this.toast.error('Booking not found.');
          this.router.navigate(['/guest/my-bookings']);
        }
      });
    });
  }

  formatCardNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    this.form.get('cardNumber')?.setValue(formatted, { emitEvent: false });
  }

  formatExpiry(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    this.form.get('expiry')?.setValue(val, { emitEvent: false });
  }

  processPayment() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.processing.set(true);
    const b = this.booking();
    if (!b) return;

    this.paymentService.processPayment({
      bookingId: this.bookingId(),
      amount: b.totalPrice,
      method: 'CreditCard',
      cardName: this.form.value.cardName || undefined,
      cardNumber: this.form.value.cardNumber || undefined,
      expiry: this.form.value.expiry || undefined,
      cvv: this.form.value.cvv || undefined
    }).subscribe({
      next: () => {
        this.processing.set(false);
        this.toast.success('Payment successful!');
        this.router.navigate(['/guest/confirmation', this.bookingId()]);
      },
      error: (err: unknown) => {
        this.processing.set(false);
        this.toast.error('Payment failed. Please check your card details.');
        console.error(err);
      }
    });
  }
}
