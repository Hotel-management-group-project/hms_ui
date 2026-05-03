// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { staffGuard } from './core/guards/staff.guard';
import { managerGuard } from './core/guards/manager.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },

  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome').then(m => m.WelcomeComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
  },

  // Auth
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register/register').then(m => m.RegisterComponent),
  },

  // Guest routes
  {
    path: 'guest',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'search', pathMatch: 'full' },
      {
        path: 'search',
        loadComponent: () => import('./pages/guest/search/search').then(m => m.SearchComponent),
      },
      {
        path: 'rooms/:id',
        loadComponent: () => import('./pages/guest/room-detail/room-detail').then(m => m.RoomDetailComponent),
      },
      {
        path: 'booking',
        loadComponent: () => import('./pages/guest/booking/booking').then(m => m.BookingComponent),
      },
      {
        path: 'my-bookings',
        loadComponent: () => import('./pages/guest/my-bookings/my-bookings').then(m => m.MyBookingsComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/guest/profile/profile').then(m => m.ProfileComponent),
      },
    ],
  },

  // Staff routes (FrontDesk+)
  {
    path: 'staff',
    canActivate: [staffGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/staff/dashboard/dashboard').then(m => m.StaffDashboardComponent),
      },
      {
        path: 'check-in',
        loadComponent: () => import('./pages/staff/check-in/check-in').then(m => m.CheckInComponent),
      },
      {
        path: 'check-out',
        loadComponent: () => import('./pages/staff/check-out/check-out').then(m => m.CheckOutComponent),
      },
      {
        path: 'room-management',
        loadComponent: () => import('./pages/staff/room-management/room-management').then(m => m.RoomManagementComponent),
      },
    ],
  },

  // Manager routes (Manager+)
  {
    path: 'manager',
    canActivate: [managerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/manager/dashboard/dashboard').then(m => m.ManagerDashboardComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/manager/reports/reports').then(m => m.ReportsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/manager/settings/settings').then(m => m.ManagerSettingsComponent),
      },
    ],
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/users/users').then(m => m.AdminUsersComponent),
      },
      {
        path: 'hotels',
        loadComponent: () => import('./pages/admin/hotels/hotels').then(m => m.AdminHotelsComponent),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'welcome' },
];
