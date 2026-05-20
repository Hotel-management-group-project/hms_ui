// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, afterNextRender } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import gsap from 'gsap';
import { RoomService } from '../../../core/services/room.service';
import { HotelService } from '../../../core/services/hotel.service';
import { UserService, CreateStaffRequest } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Hotel, Room, RoomType, User } from '../../../core/models';

type Tab = 'rates' | 'staff';

interface RoomTypeRow {
  type: RoomType;
  rooms: Room[];
  priceOffPeak: number;
  pricePeak: number;
  editing: boolean;
  saving: boolean;
}

const ROOM_TYPE_ORDER: RoomType[] = ['Standard Double', 'Deluxe King', 'Family Suite', 'Penthouse'];

@Component({
  selector: 'app-manager-settings',
  imports: [FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './settings.html',
})
export class ManagerSettingsComponent implements OnInit {
  private roomService = inject(RoomService);
  private hotelService = inject(HotelService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  // ── Tab ──────────────────────────────────────────────
  readonly activeTab = signal<Tab>('rates');

  // ── Room Rates ───────────────────────────────────────
  readonly hotels = signal<Hotel[]>([]);
  readonly rows = signal<RoomTypeRow[]>([]);
  readonly loadingRates = signal(false);
  readonly ratesError = signal('');
  selectedHotelId = '';

  // ── Staff Accounts ───────────────────────────────────
  readonly staff = signal<User[]>([]);
  readonly loadingStaff = signal(false);
  readonly staffError = signal('');
  readonly showModal = signal(false);
  readonly creating = signal(false);
  readonly filterRole = signal<'all' | 'FrontDesk' | 'Manager'>('all');
  readonly togglingId = signal<string | null>(null);

  readonly staffForm = this.fb.group({
    firstName:   ['', [Validators.required, Validators.minLength(2)]],
    lastName:    ['', [Validators.required, Validators.minLength(2)]],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(8)]],
    role:        ['FrontDesk' as 'FrontDesk' | 'Manager', Validators.required],
    phoneNumber: [''],
  });

  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from('.gsap-section', {
        y: 20,
        opacity: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all',
      });
    });
  }

  ngOnInit(): void {
    this.hotelService.getHotels().subscribe({
      next: hotels => {
        this.hotels.set(hotels);
        if (hotels.length) {
          this.selectedHotelId = hotels[0].id;
          this.loadRates();
        }
      },
    });
    this.loadStaff();
  }

  // ── Tab ──────────────────────────────────────────────

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  // ── Room Rates ───────────────────────────────────────

  loadRates(): void {
    if (!this.selectedHotelId) return;
    this.loadingRates.set(true);
    this.ratesError.set('');
    this.rows.set([]);

    this.roomService.search({ hotelId: this.selectedHotelId }).subscribe({
      next: rooms => {
        const grouped = new Map<RoomType, Room[]>();
        for (const room of rooms) {
          const arr = grouped.get(room.type) ?? [];
          arr.push(room);
          grouped.set(room.type, arr);
        }
        const built: RoomTypeRow[] = ROOM_TYPE_ORDER
          .filter(t => grouped.has(t))
          .map(t => {
            const typeRooms = grouped.get(t)!;
            const rep = typeRooms[0];
            return { type: t, rooms: typeRooms, priceOffPeak: rep.priceOffPeak, pricePeak: rep.pricePeak, editing: false, saving: false };
          });
        this.rows.set(built);
        this.loadingRates.set(false);
      },
      error: () => { this.ratesError.set('Failed to load rooms.'); this.loadingRates.set(false); },
    });
  }

  startEdit(row: RoomTypeRow): void { row.editing = true; }

  cancelEdit(row: RoomTypeRow): void {
    const rep = row.rooms[0];
    row.priceOffPeak = rep.priceOffPeak;
    row.pricePeak = rep.pricePeak;
    row.editing = false;
  }

  saveRow(row: RoomTypeRow): void {
    row.saving = true;
    const updates = row.rooms.map(r =>
      this.roomService.update(r.id, { priceOffPeak: row.priceOffPeak, pricePeak: row.pricePeak }).toPromise()
    );
    Promise.all(updates)
      .then(() => {
        row.rooms.forEach(r => { r.priceOffPeak = row.priceOffPeak; r.pricePeak = row.pricePeak; });
        row.editing = false;
        row.saving = false;
        this.toast.success(`${row.type} rates updated.`);
      })
      .catch(() => { row.saving = false; this.toast.error('Failed to save rates.'); });
  }

  get selectedHotelName(): string {
    return this.hotels().find(h => h.id === this.selectedHotelId)?.name ?? '';
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v);
  }

  // ── Staff Accounts ───────────────────────────────────

  loadStaff(): void {
    this.loadingStaff.set(true);
    this.staffError.set('');
    this.userService.getAll().subscribe({
      next: users => {
        this.staff.set(users.filter(u => u.role === 'FrontDesk' || u.role === 'Manager'));
        this.loadingStaff.set(false);
      },
      error: () => { this.staffError.set('Failed to load staff accounts.'); this.loadingStaff.set(false); },
    });
  }

  get filteredStaff(): User[] {
    const r = this.filterRole();
    return r === 'all' ? this.staff() : this.staff().filter(u => u.role === r);
  }

  openModal(): void {
    this.staffForm.reset({ role: 'FrontDesk' });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  createStaff(): void {
    if (this.staffForm.invalid) { this.staffForm.markAllAsTouched(); return; }
    this.creating.set(true);
    const v = this.staffForm.getRawValue();
    const payload: CreateStaffRequest = {
      firstName: v.firstName!, lastName: v.lastName!, email: v.email!,
      password: v.password!, role: v.role as 'FrontDesk' | 'Manager',
      phoneNumber: v.phoneNumber || undefined,
    };
    this.userService.create(payload).subscribe({
      next: user => {
        this.staff.update(list => [user, ...list]);
        this.creating.set(false);
        this.showModal.set(false);
        this.toast.success(`${user.firstName} ${user.lastName} created as ${user.role}.`);
      },
      error: (err) => {
        this.creating.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to create account.');
      },
    });
  }

  toggleActive(user: User): void {
    this.togglingId.set(user.id);
    this.userService.setActive(user.id, !user.isActive).subscribe({
      next: updated => {
        this.staff.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.togglingId.set(null);
        this.toast.success(`${updated.firstName} ${updated.isActive ? 'activated' : 'deactivated'}.`);
      },
      error: () => { this.togglingId.set(null); this.toast.error('Failed to update account.'); },
    });
  }

  fieldError(field: string, code: string): boolean {
    const c = this.staffForm.get(field);
    return !!(c?.touched && c.errors?.[code]);
  }

  roleClass(role: string): string {
    return role === 'Manager'
      ? 'text-gold-400 border-gold-400/20 bg-gold-400/10'
      : 'text-blue-400 border-blue-400/20 bg-blue-400/10';
  }
}
