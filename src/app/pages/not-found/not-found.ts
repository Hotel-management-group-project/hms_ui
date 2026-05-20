// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFoundComponent {
  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from('.gsap-404', {
        y: 30, opacity: 0, duration: 0.7, ease: 'power2.out', clearProps: 'all',
      });
    });
  }
}
