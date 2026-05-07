// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { HotelService } from '../../../core/services/hotel.service';
import { Room, Hotel } from '../../../core/models';
import { WaitlistModalComponent } from '../../../shared/components/waitlist-modal/waitlist-modal';
import gsap from 'gsap';

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

  readonly skeletons = [1, 2, 3];

  readonly form = this.fb.group({
    hotelId: [''],
    checkIn: [''],
    checkOut: [''],
    type: [''],
    capacity: [''],
  });

  readonly isPeakSeason = computed(() => {
    const checkIn = this.form.value.checkIn;
    if (!checkIn) return false;
    const month = new Date(checkIn).getMonth() + 1;
    return [6, 7, 8, 12].includes(month);
  });

  ngOnInit() {
    this.hotelService.getHotels().subscribe({
      next: (data) => this.hotels.set(data),
      error: (err: unknown) => console.error('Failed to load hotels', err),
    });
  }

  onSearch() {
    this.loading.set(true);
    this.searched.set(true);

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
    }, 40);
  }

  openWaitlist() { this.showWaitlistModal.set(true); }
  closeWaitlist() { this.showWaitlistModal.set(false); }

  getDisplayPrice(room: Room): number {
    return this.isPeakSeason() ? room.pricePeak : room.priceOffPeak;
  }
}
