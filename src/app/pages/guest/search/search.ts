
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { HotelService } from '../../../core/services/hotel.service';
import { AuthService } from '../../../core/services/auth.service';
import { Room, Hotel } from '../../../core/models';
import { WaitlistModalComponent } from '../../../shared/components/waitlist-modal/waitlist-modal';
import gsap from 'gsap';

export interface CalDay {
  date: Date | null;
  day: number;
  inMonth: boolean;
  isPeak: boolean;
  price: number;
  isPast: boolean;
}

@Component({
  selector: 'app-search',
  imports: [ReactiveFormsModule, RouterLink, WaitlistModalComponent],
  templateUrl: './search.html',
})
export class SearchComponent implements OnInit {
  private fb = inject(FormBuilder);
  private roomService = inject(RoomService);
  private hotelService = inject(HotelService);
  readonly auth = inject(AuthService);

  readonly hotels = signal<Hotel[]>([]);
  readonly rooms = signal<Room[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly showWaitlistModal = signal(false);

  readonly skeletons = [1, 2, 3];

  // ── Calendar state ─────────────────────────────────────
  readonly calendarOpen = signal(false);
  readonly calPhase = signal<'checkIn' | 'checkOut'>('checkIn');
  readonly calViewMonth = signal(new Date().getMonth());
  readonly calViewYear = signal(new Date().getFullYear());
  readonly checkInDate = signal<Date | null>(null);
  readonly checkOutDate = signal<Date | null>(null);
  readonly hoverDate = signal<Date | null>(null);
  readonly guestCount = signal(1);

  readonly WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  readonly today = new Date();

  private readonly PEAK_MONTHS = [5, 6, 7, 11]; // Jun Jul Aug Dec (0-indexed)
  private readonly OFF_PEAK_BASE = 120;
  private readonly PEAK_BASE = 180;

  // ── Computed month grids ───────────────────────────────
  readonly leftMonthGrid = computed(() =>
    this.buildGrid(this.calViewYear(), this.calViewMonth())
  );

  readonly rightMonthMeta = computed(() => {
    let m = this.calViewMonth() + 1;
    let y = this.calViewYear();
    if (m > 11) { m = 0; y++; }
    return { month: m, year: y };
  });

  readonly rightMonthGrid = computed(() => {
    const { month, year } = this.rightMonthMeta();
    return this.buildGrid(year, month);
  });

  // ── Search form ─────────────────────────────────────────
  readonly form = this.fb.group({
    hotelId: [''],
    checkIn:  [''],
    checkOut: [''],
    type:     [''],
    capacity: [''],
  });

  readonly isPeakSeason = computed(() => {
    const ci = this.checkInDate();
    return ci ? this.PEAK_MONTHS.includes(ci.getMonth()) : false;
  });

  ngOnInit() {
    this.hotelService.getHotels().subscribe({
      next: (data) => this.hotels.set(data),
      error: (err: unknown) => console.error('Failed to load hotels', err),
    });
  }

  // ── Calendar helpers ───────────────────────────────────

  buildGrid(year: number, month: number): CalDay[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const isPeakMonth = this.PEAK_MONTHS.includes(month);
    const grid: CalDay[] = [];

    for (let i = 0; i < firstWeekday; i++) {
      grid.push({ date: null, day: 0, inMonth: false, isPeak: false, price: 0, isPast: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      grid.push({
        date,
        day: d,
        inMonth: true,
        isPeak: isPeakMonth,
        price: isPeakMonth ? this.PEAK_BASE : this.OFF_PEAK_BASE,
        isPast: date < today,
      });
    }
    while (grid.length < 42) {
      grid.push({ date: null, day: 0, inMonth: false, isPeak: false, price: 0, isPast: true });
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
        // Clicked before/on check-in — restart selection
        this.checkInDate.set(day.date);
        this.checkOutDate.set(null);
        this.calPhase.set('checkOut');
      } else {
        this.checkOutDate.set(day.date);
        this.calPhase.set('checkIn');
        this.closeCalendar();
      }
    }
    this.syncFormDates();
  }

  onDayHover(day: CalDay) {
    this.hoverDate.set(day.date && !day.isPast ? day.date : null);
  }

  getDayCellClass(day: CalDay): string {
    const base = 'flex flex-col items-center justify-center py-2 rounded-md transition-all duration-150 w-full ';

    if (day.isPast) return base + 'text-ink-2/25 cursor-default';

    if (this.isCheckIn(day) || this.isCheckOut(day)) {
      return base + 'bg-gold-600 text-white font-semibold cursor-pointer shadow-sm';
    }
    if (this.isInRange(day)) {
      return base + 'bg-gold-100 text-navy-700 cursor-pointer';
    }
    return base + 'text-ink hover:bg-raised hover:text-gold-400 cursor-pointer';
  }

  getSummaryTabClass(phase: 'checkIn' | 'checkOut'): string {
    const active = this.calendarOpen() && this.calPhase() === phase;
    return `px-6 py-5 text-left transition-colors duration-150 cursor-pointer hover:bg-raised/40 ${active ? 'border-b-2 border-gold-400 bg-raised/30' : ''}`;
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

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  private syncFormDates() {
    this.form.patchValue({
      checkIn:  this.checkInDate()  ? this.toISO(this.checkInDate()!)  : '',
      checkOut: this.checkOutDate() ? this.toISO(this.checkOutDate()!) : '',
    });
  }

  private toISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}T00:00:00`;
  }

  formatDate(d: Date | null): string {
    if (!d) return '—';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  clearDates() {
    this.checkInDate.set(null);
    this.checkOutDate.set(null);
    this.calPhase.set('checkIn');
    this.form.patchValue({ checkIn: '', checkOut: '' });
  }

  adjustGuests(delta: number) {
    const next = Math.max(1, Math.min(4, this.guestCount() + delta));
    this.guestCount.set(next);
    this.form.patchValue({ capacity: next.toString() });
  }

  // ── Search ─────────────────────────────────────────────

  onSearch() {
    if (this.checkInDate() && !this.checkOutDate()) {
      this.openCalendar('checkOut');
      return;
    }
    this.loading.set(true);
    this.searched.set(true);
    this.closeCalendar();

    const query = Object.fromEntries(
      Object.entries(this.form.value).filter(([, v]) => v !== null && v !== '')
    );

    this.roomService.search(query).subscribe({
      next: (results) => {
        this.rooms.set(results);
        this.loading.set(false);
        this.animateCards();
      },
      error: (err: unknown) => {
        console.error('Search failed', err);
        this.loading.set(false);
      },
    });
  }

  private animateCards() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setTimeout(() => {
      gsap.fromTo(
        '.room-card',
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.09, ease: 'power3.out', clearProps: 'opacity,transform' }
      );
    }, 100);
  }

  openWaitlist() { this.showWaitlistModal.set(true); }
  closeWaitlist() { this.showWaitlistModal.set(false); }

  getDisplayPrice(room: Room): number {
    return this.isPeakSeason() ? room.pricePeak : room.priceOffPeak;
  }
}
