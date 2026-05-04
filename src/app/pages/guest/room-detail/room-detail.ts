// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models';
import gsap from 'gsap';

@Component({
  selector: 'app-room-detail',
  imports: [RouterLink],
  templateUrl: './room-detail.html',
})
export class RoomDetailComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private roomService = inject(RoomService);

  @ViewChild('galleryRef') galleryRef!: ElementRef;

  readonly room = signal<Room | null>(null);
  readonly loading = signal(true);
  readonly checkIn = signal<string | null>(null);
  readonly checkOut = signal<string | null>(null);

  readonly isPeakSeason = computed(() => {
    const ci = this.checkIn();
    if (!ci) return false;
    const month = new Date(ci).getMonth() + 1;
    return [6, 7, 8, 12].includes(month);
  });

  readonly displayPrice = computed(() => {
    const r = this.room();
    if (!r) return 0;
    return this.isPeakSeason() ? r.pricePeak : r.priceOffPeak;
  });

  ngOnInit() {
    // Get query params for booking dates
    this.route.queryParamMap.subscribe(params => {
      this.checkIn.set(params.get('checkIn'));
      this.checkOut.set(params.get('checkOut'));
    });

    // Fetch room details
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.roomService.getById(id).subscribe({
          next: (data) => {
            this.room.set(data);
            this.loading.set(false);
          },
          error: (err: unknown) => {
            console.error('Failed to load room details', err);
            this.loading.set(false);
          }
        });
      }
    });
  }

  ngAfterViewInit() {
    // Basic GSAP animation for the gallery once data is loaded
    // Since we're using signals, we'd normally want an effect, but a simple 
    // timeout works here to ensure the DOM has updated with the room images.
    setTimeout(() => {
      if (this.galleryRef) {
        const images = this.galleryRef.nativeElement.querySelectorAll('img');
        if (images.length) {
          gsap.from(images, {
            opacity: 0,
            y: 30,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out'
          });
        }
      }
    }, 100);
  }
}
