import { Component, OnDestroy, inject, signal, afterNextRender } from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.html',
})
export class WelcomeComponent implements OnDestroy {
  private router = inject(Router);
  private tl: gsap.core.Timeline | null = null;
  readonly animating = signal(true);

  constructor() {
    afterNextRender(() => this.init());
  }

  ngOnDestroy() {
    this.tl?.kill();
  }

  private init() {
    // Skill rule: always respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.navigateHome();
      return;
    }
    this.play();
  }

  private play() {
    // Set initial state of content behind doors
    gsap.set('.hms-content', { opacity: 0, y: 24 });
    gsap.set('.hms-tagline', { opacity: 0 });

    this.tl = gsap.timeline({ delay: 0.4 });

    this.tl
      // Doors open outward simultaneously — ease-in for exit per skill rule
      .to('.door-left', {
        rotateY: -105,
        duration: 1.5,
        ease: 'power3.inOut',
        transformOrigin: '0% 50%',
      }, 0)
      .to('.door-right', {
        rotateY: 105,
        duration: 1.5,
        ease: 'power3.inOut',
        transformOrigin: '100% 50%',
      }, 0)
      // Fade out center seam line as doors open
      .to('.door-seam', {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
      }, 0.1)
      // HMS text rises in — ease-out for entrance per skill rule
      .to('.hms-content', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
      }, 0.55)
      .to('.hms-tagline', {
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
      }, 0.95)
      // Hold for 1.2s then navigate
      .to({}, { duration: 1.2 })
      .call(() => this.navigateHome());
  }

  enter() {
    this.tl?.kill();
    this.navigateHome();
  }

  private navigateHome() {
    this.animating.set(false);
    this.router.navigate(['/home']);
  }
}
