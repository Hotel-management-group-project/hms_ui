// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed, afterNextRender, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { AncillaryServiceService } from '../../../core/services/ancillary.service';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Room, AncillaryService } from '../../../core/models';
import gsap from 'gsap';

type ServiceRow = AncillaryService & { selected: boolean; quantity: number };

@Component({
  selector: 'app-room-detail',
  imports: [RouterLink],
  templateUrl: './room-detail.html',
})
export class RoomDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private roomService = inject(RoomService);
  private ancillaryService = inject(AncillaryServiceService);
  private bookingService = inject(BookingService);
  private toast = inject(ToastService);
  private el = inject(ElementRef);

  readonly room = signal<Room | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly services = signal<ServiceRow[]>([]);

  readonly checkIn = signal('');
  readonly checkOut = signal('');

  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const host = this.el.nativeElement as HTMLElement;
      gsap.from(host.querySelectorAll('.gsap-reveal'), {
        opacity: 0,
        y: 28,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'all',
      });
    });
  }

  readonly isPeakSeason = computed(() => {
    const ci = this.checkIn();
    if (!ci) return false;
    return [6, 7, 8, 12].includes(new Date(ci).getMonth() + 1);
  });

  readonly displayPrice = computed(() => {
    const r = this.room();
    if (!r) return 0;
    return this.isPeakSeason() ? r.pricePeak : r.priceOffPeak;
  });

  readonly nights = computed(() => {
    const ci = new Date(this.checkIn());
    const co = new Date(this.checkOut());
    if (isNaN(ci.getTime()) || isNaN(co.getTime())) return 0;
    const diff = Math.ceil((co.getTime() - ci.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  });

  readonly roomSubtotal = computed(() => this.displayPrice() * this.nights());

  readonly ancillaryTotal = computed(() =>
    this.services()
      .filter(s => s.selected)
      .reduce((sum, s) => sum + s.price * s.quantity, 0)
  );

  readonly grandTotal = computed(() => this.roomSubtotal() + this.ancillaryTotal());

  readonly datesValid = computed(() => this.nights() > 0);

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const ci = params.get('checkIn');
      const co = params.get('checkOut');
      if (ci) this.checkIn.set(ci);
      if (co) this.checkOut.set(co);
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;

      this.roomService.getById(id).subscribe({
        next: (data) => {
          this.room.set(data);
          this.loading.set(false);
          this.loadServices();
        },
        error: (err: unknown) => {
          console.error(err);
          this.loading.set(false);
          this.toast.error('Failed to load room details.');
        },
      });
    });
  }

  private loadServices() {
    this.ancillaryService.getAncillaryServices().subscribe({
      next: (list) =>
        this.services.set(list.map(s => ({ ...s, selected: false, quantity: 1 }))),
      error: () =>
        this.services.set([
          { id: '1', name: 'Airport Transfer', description: 'One-way transfer to/from the airport', price: 50, selected: false, quantity: 1 },
          { id: '2', name: 'Full English Breakfast', description: 'Per person, served daily', price: 20, selected: false, quantity: 1 },
          { id: '3', name: 'Spa Access', description: 'Full spa facilities per person', price: 35, selected: false, quantity: 1 },
          { id: '4', name: 'Late Check-out', description: 'Extended check-out until 2:00 PM', price: 40, selected: false, quantity: 1 },
        ]),
    });
  }

  setCheckIn(value: string) { this.checkIn.set(value); }
  setCheckOut(value: string) { this.checkOut.set(value); }

  toggleService(id: string) {
    this.services.update(list =>
      list.map(s => s.id === id ? { ...s, selected: !s.selected } : s)
    );
  }

  updateQty(id: string, delta: number) {
    this.services.update(list =>
      list.map(s => s.id === id ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s)
    );
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  confirmBooking() {
    const r = this.room();
    if (!r) return;

    if (!this.datesValid()) {
      this.toast.warning('Please select valid check-in and check-out dates.');
      return;
    }

    this.submitting.set(true);

    const ancillaries = this.services()
      .filter(s => s.selected)
      .map(s => ({ serviceId: s.id, quantity: s.quantity }));

    this.bookingService.createBooking({
      hotelId: r.hotelId,
      checkInDate: this.checkIn(),
      checkOutDate: this.checkOut(),
      roomIds: [r.id],
      ancillaryServices: ancillaries,
    }).subscribe({
      next: (booking) => {
        this.submitting.set(false);
        this.toast.success('Booking created! Proceeding to payment.');
        this.router.navigate(['/guest/payment', booking.id]);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toast.error('Failed to create booking. Please try again.');
        console.error(err);
      },
    });
  }
}
