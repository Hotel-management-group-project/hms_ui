// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationError, NavigationCancel } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './core/services/auth.service';
import { InactivityService } from './core/services/inactivity.service';
import { ThemeService } from './core/services/theme.service';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { ToastComponent } from './shared/components/toast/toast';
import { LoadingComponent } from './shared/components/loading/loading';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastComponent, LoadingComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly inactivity = inject(InactivityService);
  private readonly router = inject(Router);

  // Initialize ThemeService on boot to apply dark class before first render
  private readonly _theme = inject(ThemeService);

  // Route loading state
  readonly isRouteLoading = signal(false);

  // Reactive current URL string (updates on each NavigationEnd)
  private readonly url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url }
  );

  readonly showNavbar = computed(() => {
    const u = this.url();
    return u !== '/' && !u.startsWith('/welcome');
  });

  readonly showFooter = computed(() => {
    const u = this.url();
    return u.startsWith('/home') ||
           u.startsWith('/guest/search') ||
           u.startsWith('/guest/rooms');
  });

  constructor() {
    this.router.events.pipe(
      filter(e =>
        e instanceof NavigationStart ||
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      )
    ).subscribe(e => {
      this.isRouteLoading.set(e instanceof NavigationStart);
    });
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.inactivity.start();
    }
  }
}
