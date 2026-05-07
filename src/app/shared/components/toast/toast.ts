// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = ++this.counter;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  success(msg: string): void { this.show(msg, 'success'); }
  error(msg: string): void   { this.show(msg, 'error'); }
  info(msg: string): void    { this.show(msg, 'info'); }
  warning(msg: string): void { this.show(msg, 'warning'); }
}

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  wrapperClass(type: ToastType): string {
    return {
      success: 'bg-navy-800 border-green-500/40 shadow-[0_4px_24px_rgba(74,222,128,0.12)]',
      error:   'bg-navy-800 border-red-500/40 shadow-[0_4px_24px_rgba(248,113,113,0.12)]',
      warning: 'bg-navy-800 border-amber-500/40 shadow-[0_4px_24px_rgba(251,191,36,0.12)]',
      info:    'bg-navy-800 border-blue-500/40 shadow-[0_4px_24px_rgba(96,165,250,0.12)]',
    }[type];
  }

  iconClass(type: ToastType): string {
    return {
      success: 'text-green-400',
      error:   'text-red-400',
      warning: 'text-amber-400',
      info:    'text-blue-400',
    }[type];
  }

  barClass(type: ToastType): string {
    return {
      success: 'bg-green-400',
      error:   'bg-red-400',
      warning: 'bg-amber-400',
      info:    'bg-blue-400',
    }[type];
  }

  iconPath(type: ToastType): string {
    return {
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      error:   'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    }[type];
  }
}
