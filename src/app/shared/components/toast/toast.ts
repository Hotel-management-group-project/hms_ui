// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)
import { Component, signal, Injectable } from '@angular/core';

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

  show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = ++this.counter;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string)   { this.show(msg, 'error'); }
  info(msg: string)    { this.show(msg, 'info'); }
  warning(msg: string) { this.show(msg, 'warning'); }
}

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
})
export class ToastComponent {
  toastService = new ToastService();

  toastClasses(type: ToastType): string {
    return {
      success: 'bg-green-900 border border-green-700 text-green-100',
      error:   'bg-red-900 border border-red-700 text-red-100',
      warning: 'bg-amber-900 border border-amber-700 text-amber-100',
      info:    'bg-navy-600 border border-navy-500 text-cream-200',
    }[type];
  }

  toastIcon(type: ToastType): string {
    return { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }[type];
  }
}
