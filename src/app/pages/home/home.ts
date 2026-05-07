import { Component, OnDestroy, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class HomeComponent implements OnDestroy {

  readonly roomTypes = [
    {
      name: 'Standard Double',
      type: 'standard',
      capacity: '2 Guests',
      size: '28 m²',
      priceFrom: 'From £120 / night',
      desc: 'Elegant comfort for two, with premium bedding and city views.',
    },
    {
      name: 'Deluxe King',
      type: 'deluxe',
      capacity: '2 Guests',
      size: '38 m²',
      priceFrom: 'From £180 / night',
      desc: 'Spacious king room with lounge area, marble bath, and panoramic views.',
    },
    {
      name: 'Family Suite',
      type: 'family',
      capacity: '4 Guests',
      size: '55 m²',
      priceFrom: 'From £240 / night',
      desc: 'Two-bedroom suite with living room, perfect for families and groups.',
    },
    {
      name: 'Penthouse',
      type: 'penthouse',
      capacity: '4 Guests',
      size: '110 m²',
      priceFrom: 'From £500 / night',
      desc: 'The pinnacle of luxury — private terrace, butler service, and skyline views.',
    },
  ];

  constructor() {
    afterNextRender(() => this.initAnimations());
  }

  ngOnDestroy() {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  private initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Skill rule: respect prefers-reduced-motion.
    // Elements start at opacity:0 via HTML inline style — reveal them immediately.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set('.hero-content > *', { opacity: 1, y: 0 });
      return;
    }

    // Hero entrance — fromTo so GSAP owns both start AND end state.
    // Elements already have opacity:0 in HTML so there is no FOUC before this runs.
    // No clearProps: GSAP keeps opacity:1 / y:0 inline after animation ends.
    gsap.fromTo(
      '.hero-content > *',
      { y: 32, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.18,
        ease: 'power3.out',
        delay: 0.2,
      }
    );

    // Scroll-triggered reveal for every .scroll-reveal element
    // skill rule: use transform/opacity, not width/height
    gsap.utils.toArray<Element>('.scroll-reveal').forEach((el, i) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power2.out',
        delay: i % 4 * 0.08, // subtle stagger within each row
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
