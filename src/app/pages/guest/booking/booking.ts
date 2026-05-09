// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { AncillaryServiceService } from '../../../core/services/ancillary.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Room, AncillaryService } from '../../../core/models';

@Component({
  selector: 'app-booking',
  imports: [ReactiveFormsModule],
  templateUrl: './booking.html',
})
export class BookingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private roomService = inject(RoomService);
  private ancillaryService = inject(AncillaryServiceService);
  private bookingService = inject(BookingService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly step = signal<1 | 2 | 3>(1);
  readonly loading = signal(true);
  readonly submitting = signal(false);

  readonly room = signal<Room | null>(null);
  readonly ancillaryServices = signal<(AncillaryService & { selected: boolean, quantity: number })[]>([]);
  
  readonly checkIn = signal<string>('');
  readonly checkOut = signal<string>('');

  readonly guestForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['']
  });

  readonly isPeakSeason = computed(() => {
    const ci = this.checkIn();
    if (!ci) return false;
    const month = new Date(ci).getMonth() + 1;
    return [6, 7, 8, 12].includes(month);
  });

  readonly roomPrice = computed(() => {
    const r = this.room();
    if (!r) return 0;
    return this.isPeakSeason() ? r.pricePeak : r.priceOffPeak;
  });

  readonly nights = computed(() => {
    const ci = new Date(this.checkIn());
    const co = new Date(this.checkOut());
    if (isNaN(ci.getTime()) || isNaN(co.getTime())) return 1;
    const diffTime = Math.abs(co.getTime() - ci.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  });

  readonly totalAncillaryPrice = computed(() => {
    return this.ancillaryServices()
      .filter(s => s.selected)
      .reduce((sum, s) => sum + (s.price * s.quantity * this.nights()), 0);
  });

  readonly totalPrice = computed(() => {
    return (this.roomPrice() * this.nights()) + this.totalAncillaryPrice();
  });

  ngOnInit() {
    // Prefill guest form if user is logged in
    const user = this.auth.currentUser();
    if (user) {
      this.guestForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: ''
      });
    }

    this.route.queryParamMap.subscribe(params => {
      const roomId = params.get('roomId');
      this.checkIn.set(params.get('checkIn') || '');
      this.checkOut.set(params.get('checkOut') || '');

      if (!roomId || !this.checkIn() || !this.checkOut()) {
        this.toast.error('Missing booking details. Redirecting to search.');
        this.router.navigate(['/guest/search']);
        return;
      }

      this.roomService.getById(roomId).subscribe({
        next: (r) => {
          this.room.set(r);
          this.loadAncillaryServices();
        },
        error: (err: unknown) => {
          this.toast.error('Failed to load room details.');
          console.error(err);
          this.router.navigate(['/guest/search']);
        }
      });
    });
  }

  private loadAncillaryServices() {
    this.ancillaryService.getAncillaryServices().subscribe({
      next: (services) => {
        this.ancillaryServices.set(services.map(s => ({ ...s, selected: false, quantity: 1 })));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load services', err);
        this.loading.set(false); // don't block if extras fail
      }
    });
  }

  toggleAncillary(id: string) {
    this.ancillaryServices.update(services => 
      services.map(s => s.id === id ? { ...s, selected: !s.selected } : s)
    );
  }

  updateQuantity(id: string, delta: number) {
    this.ancillaryServices.update(services => 
      services.map(s => {
        if (s.id === id) {
          const newQ = Math.max(1, s.quantity + delta);
          return { ...s, quantity: newQ };
        }
        return s;
      })
    );
  }

  nextStep() {
    if (this.step() < 3) {
      this.step.set((this.step() + 1) as 1|2|3);
    }
  }

  prevStep() {
    if (this.step() > 1) {
      this.step.set((this.step() - 1) as 1|2|3);
    }
  }

  submitBooking() {
    if (this.guestForm.invalid) {
      this.guestForm.markAllAsTouched();
      return;
    }

    const r = this.room();
    if (!r) return;

    this.submitting.set(true);

    const iso = (s: string) => s.includes('T') ? s : `${s}T00:00:00`;

    this.bookingService.createBooking({
      hotelId: r.hotelId,
      checkInDate: iso(this.checkIn()),
      checkOutDate: iso(this.checkOut()),
      roomIds: [Number(r.id)],
      ancillaryServices: this.ancillaryServices()
        .filter(s => s.selected)
        .map(s => ({ serviceId: Number(s.id), quantity: s.quantity })),
    }).subscribe({
      next: (booking) => {
        this.submitting.set(false);
        this.toast.success('Booking created! Please complete payment.');
        this.router.navigate(['/guest/payment', booking.id]);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toast.error('Failed to create booking. Please try again.');
        console.error(err);
      }
    });
  }
}
