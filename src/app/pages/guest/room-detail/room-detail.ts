// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed, afterNextRender, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { AncillaryServiceService } from '../../../core/services/ancillary.service';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { AuthService } from '../../../core/services/auth.service';
import { Room, AncillaryService } from '../../../core/models';
import gsap from 'gsap';

export interface CalDay {
  date: Date | null;
  day: number;
  inMonth: boolean;
  isPast: boolean;
}

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
  readonly auth = inject(AuthService);

  readonly room = signal<Room | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly services = signal<ServiceRow[]>([]);

  // ── Calendar state ──────────────────────────────────────
  readonly calendarOpen = signal(false);
  readonly calPhase = signal<'checkIn' | 'checkOut'>('checkIn');
  readonly calViewMonth = signal(new Date().getMonth());
  readonly calViewYear = signal(new Date().getFullYear());
  readonly checkInDate = signal<Date | null>(null);
  readonly checkOutDate = signal<Date | null>(null);
  readonly hoverDate = signal<Date | null>(null);

  readonly WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  readonly todayDate = new Date();

  readonly monthGrid = computed(() => this.buildGrid(this.calViewYear(), this.calViewMonth()));

  readonly checkIn = computed(() =>
    this.checkInDate() ? this.toISO(this.checkInDate()!) : ''
  );
  readonly checkOut = computed(() =>
    this.checkOutDate() ? this.toISO(this.checkOutDate()!) : ''
  );

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
      if (ci) {
        const d = new Date(ci);
        this.checkInDate.set(d);
        this.calViewMonth.set(d.getMonth());
        this.calViewYear.set(d.getFullYear());
      }
      if (co) this.checkOutDate.set(new Date(co));
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

  // ── Calendar methods ────────────────────────────────────

  buildGrid(year: number, month: number): CalDay[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: CalDay[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      grid.push({ date: null, day: 0, inMonth: false, isPast: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      grid.push({ date, day: d, inMonth: true, isPast: date < today });
    }
    while (grid.length < 42) {
      grid.push({ date: null, day: 0, inMonth: false, isPast: true });
    }
    return grid;
  }

  openCalendar(phase: 'checkIn' | 'checkOut') {
    this.calPhase.set(phase);
    this.calendarOpen.set(true);
  }

  closeCalendar() {
    this.calendarOpen.set(false);
    this.hoverDate.set(null);
  }

  prevMonth() {
    const now = new Date();
    if (this.calViewYear() === now.getFullYear() && this.calViewMonth() === now.getMonth()) return;
    let m = this.calViewMonth() - 1;
    let y = this.calViewYear();
    if (m < 0) { m = 11; y--; }
    this.calViewMonth.set(m);
    this.calViewYear.set(y);
  }

  nextMonth() {
    let m = this.calViewMonth() + 1;
    let y = this.calViewYear();
    if (m > 11) { m = 0; y++; }
    this.calViewMonth.set(m);
    this.calViewYear.set(y);
  }

  onDayClick(day: CalDay) {
    if (!day.date || day.isPast) return;
    if (this.calPhase() === 'checkIn') {
      this.checkInDate.set(day.date);
      this.checkOutDate.set(null);
      this.calPhase.set('checkOut');
    } else {
      const ci = this.checkInDate();
      if (!ci || day.date <= ci) {
        this.checkInDate.set(day.date);
        this.checkOutDate.set(null);
        this.calPhase.set('checkOut');
      } else {
        this.checkOutDate.set(day.date);
        this.closeCalendar();
      }
    }
  }

  onDayHover(day: CalDay) {
    this.hoverDate.set(day.date && !day.isPast ? day.date : null);
  }

  getDayCellClass(day: CalDay): string {
    const base = 'flex items-center justify-center h-8 w-8 rounded-full text-xs transition-all duration-100 ';
    if (!day.inMonth) return base + 'invisible';
    if (day.isPast) return base + 'text-ink-2/25 cursor-default';
    if (this.isCheckIn(day) || this.isCheckOut(day))
      return base + 'bg-gold-600 text-white font-semibold cursor-pointer';
    if (this.isInRange(day))
      return base + 'bg-gold-500/15 text-ink cursor-pointer rounded-none';
    return base + 'text-ink hover:bg-raised hover:text-gold-400 cursor-pointer';
  }

  isCheckIn(day: CalDay): boolean {
    return !!day.date && !!this.checkInDate() && this.sameDay(day.date, this.checkInDate()!);
  }

  isCheckOut(day: CalDay): boolean {
    if (!day.date) return false;
    const co = this.checkOutDate() ?? (this.calPhase() === 'checkOut' ? this.hoverDate() : null);
    return !!co && this.sameDay(day.date, co);
  }

  isInRange(day: CalDay): boolean {
    if (!day.date) return false;
    const ci = this.checkInDate();
    const co = this.checkOutDate() ?? (this.calPhase() === 'checkOut' ? this.hoverDate() : null);
    if (!ci || !co) return false;
    return day.date > ci && day.date < co;
  }

  isToday(day: CalDay): boolean {
    return !!day.date && this.sameDay(day.date, new Date());
  }

  clearDates() {
    this.checkInDate.set(null);
    this.checkOutDate.set(null);
    this.calPhase.set('checkIn');
  }

  formatDate(d: Date | null): string {
    if (!d) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  private toISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}T00:00:00`;
  }

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

  private readonly ROOM_IMAGES: Record<string, string[]> = {
    'Standard Double': ['/assets/images/standard-double.jpg', '/assets/images/deluxe-king.jpg',    '/assets/images/family-suite.jpg'],
    'Deluxe King':     ['/assets/images/deluxe-king.jpg',     '/assets/images/standard-double.jpg', '/assets/images/penthouse.jpg'],
    'Family Suite':    ['/assets/images/family-suite.jpg',    '/assets/images/standard-double.jpg', '/assets/images/deluxe-king.jpg'],
    'Penthouse':       ['/assets/images/penthouse.jpg',       '/assets/images/pool.jpg',             '/assets/images/family-suite.jpg'],
  };

  getRoomImage(room: Room, index = 0): string {
    return room.imageUrls?.[index]
      || this.ROOM_IMAGES[room.type]?.[index]
      || '/assets/images/standard-double.jpg';
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  confirmBooking() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const r = this.room();
    if (!r) return;

    if (!this.datesValid()) {
      this.toast.warning('Please select valid check-in and check-out dates.');
      return;
    }

    this.submitting.set(true);

    const iso = (s: string) => s.includes('T') ? s : `${s}T00:00:00`;

    this.bookingService.createBooking({
      hotelId: r.hotelId,
      checkInDate: iso(this.checkIn()),
      checkOutDate: iso(this.checkOut()),
      roomIds: [Number(r.id)],
      ancillaryServices: this.services()
        .filter(s => s.selected)
        .map(s => ({ serviceId: Number(s.id), quantity: s.quantity })),
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
