import { Component, OnDestroy, afterNextRender, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HotelService } from '../../core/services/hotel.service';
import { Hotel } from '../../core/models';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type HotelTier = 'all' | 'luxury' | 'lifestyle';

interface DisplayHotel extends Hotel {
  tier: 'luxury' | 'lifestyle';
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class HomeComponent implements OnDestroy {
  private hotelService = inject(HotelService);

  @ViewChild('hotelSlider') sliderRef?: ElementRef<HTMLDivElement>;

  readonly hotels = signal<DisplayHotel[]>([]);
  readonly hotelsLoading = signal(true);
  readonly activeTab = signal<HotelTier>('all');

  readonly filteredHotels = computed(() => {
    const tab = this.activeTab();
    const all = this.hotels();
    if (tab === 'all') return all;
    return all.filter(h => h.tier === tab);
  });

  readonly tabs: { id: HotelTier; label: string }[] = [
    { id: 'all',       label: 'All Collections'       },
    { id: 'luxury',    label: 'Luxury Collection'     },
    { id: 'lifestyle', label: 'Lifestyle Collection'  },
  ];

  constructor() {
    afterNextRender(() => this.initAnimations());
    this.loadHotels();
  }

  ngOnDestroy() {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  private loadHotels() {
    this.hotelService.getHotels().subscribe({
      next: (data) => {
        this.hotels.set(
          data
            .filter(h => h.isActive)
            .map((h, i) => ({ ...h, tier: this.assignTier(h, i) }))
        );
        this.hotelsLoading.set(false);
      },
      error: () => this.hotelsLoading.set(false),
    });
  }

  // Luxury = grand/palace/royal/manor in name, or even index as fallback
  private assignTier(hotel: Hotel, index: number): 'luxury' | 'lifestyle' {
    const text = (hotel.name + ' ' + hotel.location).toLowerCase();
    if (
      text.includes('grand') || text.includes('palace') ||
      text.includes('royal') || text.includes('manor') ||
      text.includes('luxury') || text.includes('penthouse')
    ) return 'luxury';
    return index % 2 === 0 ? 'luxury' : 'lifestyle';
  }

  setTab(tab: HotelTier) {
    this.activeTab.set(tab);
    this.sliderRef?.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
  }

  scrollPrev() {
    this.sliderRef?.nativeElement.scrollBy({ left: -460, behavior: 'smooth' });
  }

  scrollNext() {
    this.sliderRef?.nativeElement.scrollBy({ left: 460, behavior: 'smooth' });
  }

  private initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set('.hero-content > *', { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      '.hero-content > *',
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, stagger: 0.18, ease: 'power3.out', delay: 0.2 }
    );

    gsap.utils.toArray<Element>('.scroll-reveal').forEach((el, i) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power2.out',
        delay: i % 4 * 0.08,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
        clearProps: 'all',
      });
    });
  }
}
