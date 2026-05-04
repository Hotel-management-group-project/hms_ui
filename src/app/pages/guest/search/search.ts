// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { HotelService } from '../../../core/services/hotel.service';
import { Room, Hotel } from '../../../core/models';
import { WaitlistModalComponent } from '../../../shared/components/waitlist-modal/waitlist-modal';

@Component({
  selector: 'app-search',
  imports: [ReactiveFormsModule, RouterLink, WaitlistModalComponent],
  templateUrl: './search.html',
})
export class SearchComponent implements OnInit {
  private fb = inject(FormBuilder);
  private roomService = inject(RoomService);
  private hotelService = inject(HotelService);

  readonly hotels = signal<Hotel[]>([]);
  readonly rooms = signal<Room[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly showWaitlistModal = signal(false);

  readonly form = this.fb.group({
    hotelId: [''],
    checkIn: [''],
    checkOut: [''],
    type: [''],
    capacity: ['']
  });

  readonly isPeakSeason = computed(() => {
    const checkIn = this.form.value.checkIn;
    if (!checkIn) return false;
    const date = new Date(checkIn);
    const month = date.getMonth() + 1; // 1-12
    return [6, 7, 8, 12].includes(month);
  });

  ngOnInit() {
    this.hotelService.getHotels().subscribe({
      next: (data) => this.hotels.set(data),
      error: (err: unknown) => console.error('Failed to load hotels', err)
    });
  }

  onSearch() {
    this.loading.set(true);
    this.searched.set(true);
    
    // Clean up empty values
    const query = Object.fromEntries(
      Object.entries(this.form.value).filter(([_, v]) => v !== null && v !== '')
    );

    this.roomService.search(query).subscribe({
      next: (results) => {
        this.rooms.set(results);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Search failed', err);
        this.loading.set(false);
      }
    });
  }

  openWaitlist() {
    this.showWaitlistModal.set(true);
  }

  closeWaitlist() {
    this.showWaitlistModal.set(false);
  }

  getDisplayPrice(room: Room): number {
    return this.isPeakSeason() ? room.pricePeak : room.priceOffPeak;
  }
}
