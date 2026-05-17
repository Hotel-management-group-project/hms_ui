// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../../core/services/room.service';
import { HotelService } from '../../../core/services/hotel.service';
import { Hotel, Room, RoomType } from '../../../core/models';
import { ToastService } from '../../../shared/components/toast/toast';

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
  selector: 'app-room-rates',
  imports: [FormsModule],
  templateUrl: './room-rates.html',
})
export class RoomRatesComponent implements OnInit {
  private roomService = inject(RoomService);
  private hotelService = inject(HotelService);
  private toast = inject(ToastService);

  readonly hotels = signal<Hotel[]>([]);
  readonly rows = signal<RoomTypeRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  selectedHotelId = '';

  readonly defaultRates: Record<RoomType, { offPeak: number; peak: number }> = {
    'Standard Double': { offPeak: 120, peak: 180 },
    'Deluxe King':     { offPeak: 180, peak: 250 },
    'Family Suite':    { offPeak: 240, peak: 320 },
    'Penthouse':       { offPeak: 500, peak: 750 },
  };

  ngOnInit(): void {
    this.hotelService.getHotels().subscribe({
      next: hotels => {
        this.hotels.set(hotels);
        if (hotels.length) {
          this.selectedHotelId = hotels[0].id;
          this.loadRooms();
        }
      },
    });
  }

  loadRooms(): void {
    if (!this.selectedHotelId) return;
    this.loading.set(true);
    this.error.set('');
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
            return {
              type: t,
              rooms: typeRooms,
              priceOffPeak: rep.priceOffPeak,
              pricePeak: rep.pricePeak,
              editing: false,
              saving: false,
            };
          });

        this.rows.set(built);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load rooms.');
        this.loading.set(false);
      },
    });
  }

  startEdit(row: RoomTypeRow): void {
    row.editing = true;
  }

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
        this.toast.show(`${row.type} rates updated.`, 'success');
      })
      .catch(() => {
        row.saving = false;
        this.toast.show('Failed to save rates.', 'error');
      });
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v);
  }

  get selectedHotelName(): string {
    return this.hotels().find(h => h.id === this.selectedHotelId)?.name ?? '';
  }
}
