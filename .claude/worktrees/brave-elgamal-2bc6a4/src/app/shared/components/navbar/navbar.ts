// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

interface NavLink { path: string; label: string; }

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly menuOpen = signal(false);

  readonly navLinks = computed<NavLink[]>(() => {
    if (!this.auth.isAuthenticated()) {
      return [
        { path: '/home',          label: 'Home' },
        { path: '/guest/search',  label: 'Search Rooms' },
      ];
    }
    switch (this.auth.getRole()) {
      case 'Guest': return [
        { path: '/home',                  label: 'Home' },
        { path: '/guest/search',          label: 'Search Rooms' },
        { path: '/guest/my-bookings',     label: 'My Bookings' },
        { path: '/guest/profile',         label: 'Profile' },
      ];
      case 'FrontDesk': return [
        { path: '/staff/dashboard',       label: 'Dashboard' },
        { path: '/staff/check-in',        label: 'Check-in' },
        { path: '/staff/check-out',       label: 'Check-out' },
        { path: '/staff/room-management', label: 'Room Management' },
      ];
      case 'Manager': return [
        { path: '/manager/dashboard',     label: 'Dashboard' },
        { path: '/manager/reports',       label: 'Reports' },
        { path: '/manager/settings',      label: 'Settings' },
      ];
      case 'Admin': return [
        { path: '/admin/dashboard',       label: 'Dashboard' },
        { path: '/admin/users',           label: 'Users' },
        { path: '/admin/hotels',          label: 'Hotels' },
      ];
      default: return [];
    }
  });

  readonly userDisplayName = computed(() => {
    const u = this.auth.currentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  readonly roleLabel = computed(() => this.auth.getRole() ?? '');

  readonly roleBadgeClass = computed(() => {
    const map: Record<string, string> = {
      Admin:     'text-red-400 bg-red-400/10 border-red-400/20',
      Manager:   'text-gold-400 bg-gold-400/10 border-gold-400/20',
      FrontDesk: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      Guest:     'text-ink-2/60 bg-raised/50 border-rim-2',
    };
    return map[this.roleLabel()] ?? map['Guest'];
  });

  toggleMenu(): void { this.menuOpen.update(v => !v); }
  closeMenu(): void  { this.menuOpen.set(false); }
  logout(): void     { this.auth.logout(); this.closeMenu(); }
}
