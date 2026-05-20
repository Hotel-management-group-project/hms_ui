// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { staffGuard } from './core/guards/staff.guard';
import { managerGuard } from './core/guards/manager.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },

  {
    path: 'welcome',
    title: 'HMS — Welcome',
    loadComponent: () => import('./pages/welcome/welcome').then(m => m.WelcomeComponent),
  },
  {
    path: 'home',
    title: 'HMS — Luxury Hotel Management',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
  },

  // Auth
  {
    path: 'auth/login',
    title: 'HMS — Sign In',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./pages/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'auth/register',
    title: 'HMS — Create Account',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./pages/auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'auth/change-password',
    title: 'HMS — Update Password',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/auth/change-password/change-password').then(m => m.ChangePasswordComponent),
  },

  // Public browsing routes (no auth required)
  {
    path: 'guest/search',
    title: 'HMS — Search Rooms',
    loadComponent: () => import('./pages/guest/search/search').then(m => m.SearchComponent),
  },
  {
    path: 'guest/rooms/:id',
    title: 'HMS — Room Details',
    loadComponent: () => import('./pages/guest/room-detail/room-detail').then(m => m.RoomDetailComponent),
  },

  // Guest routes (auth required)
  {
    path: 'guest',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'search', pathMatch: 'full' },
      {
        path: 'booking',
        title: 'HMS — Book Your Stay',
        loadComponent: () => import('./pages/guest/booking/booking').then(m => m.BookingComponent),
      },
      {
        path: 'my-bookings',
        title: 'HMS — My Bookings',
        loadComponent: () => import('./pages/guest/my-bookings/my-bookings').then(m => m.MyBookingsComponent),
      },
      {
        path: 'profile',
        title: 'HMS — My Profile',
        loadComponent: () => import('./pages/guest/profile/profile').then(m => m.ProfileComponent),
      },
      {
        path: 'payment/:bookingId',
        title: 'HMS — Payment',
        loadComponent: () => import('./pages/guest/payment/payment').then(m => m.PaymentComponent),
      },
      {
        path: 'confirmation/:bookingId',
        title: 'HMS — Booking Confirmed',
        loadComponent: () => import('./pages/guest/confirmation/confirmation').then(m => m.ConfirmationComponent),
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
        title: 'HMS — Staff Dashboard',
        loadComponent: () => import('./pages/staff/dashboard/dashboard').then(m => m.StaffDashboardComponent),
      },
      {
        path: 'check-in',
        title: 'HMS — Check-in',
        loadComponent: () => import('./pages/staff/check-in/check-in').then(m => m.CheckInComponent),
      },
      {
        path: 'check-out',
        title: 'HMS — Check-out',
        loadComponent: () => import('./pages/staff/check-out/check-out').then(m => m.CheckOutComponent),
      },
      {
        path: 'room-management',
        title: 'HMS — Room Management',
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
        title: 'HMS — Manager Dashboard',
        loadComponent: () => import('./pages/manager/dashboard/dashboard').then(m => m.ManagerDashboardComponent),
      },
      {
        path: 'reports',
        title: 'HMS — Reports & Analytics',
        loadComponent: () => import('./pages/manager/reports/reports').then(m => m.ReportsComponent),
      },
      {
        path: 'room-rates',
        title: 'HMS — Room Rates',
        loadComponent: () => import('./pages/manager/room-rates/room-rates').then(m => m.RoomRatesComponent),
      },
      {
        path: 'staff-accounts',
        title: 'HMS — Staff Accounts',
        loadComponent: () => import('./pages/manager/staff-accounts/staff-accounts').then(m => m.StaffAccountsComponent),
      },
      {
        path: 'audit-logs',
        title: 'HMS — Audit Logs',
        loadComponent: () => import('./pages/manager/audit-logs/audit-logs').then(m => m.AuditLogsComponent),
      },
      {
        path: 'settings',
        title: 'HMS — Settings',
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
        title: 'HMS — Admin Dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'users',
        title: 'HMS — User Management',
        loadComponent: () => import('./pages/admin/users/users').then(m => m.AdminUsersComponent),
      },
      {
        path: 'hotels',
        title: 'HMS — Hotel Configuration',
        loadComponent: () => import('./pages/admin/hotels/hotels').then(m => m.AdminHotelsComponent),
      },
    ],
  },

  // 404
  {
    path: '**',
    title: 'HMS — Page Not Found',
    loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFoundComponent),
  },
];
