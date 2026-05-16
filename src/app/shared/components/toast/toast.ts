
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

  accentClass(type: ToastType): string {
    return {
      success: 'border-l-green-400',
      error:   'border-l-red-400',
      warning: 'border-l-amber-400',
      info:    'border-l-gold-400',
    }[type];
  }

  iconClass(type: ToastType): string {
    return {
      success: 'text-green-400',
      error:   'text-red-400',
      warning: 'text-amber-400',
      info:    'text-gold-400',
    }[type];
  }

  iconPath(type: ToastType): string {
    return {
      success: 'M5 13l4 4L19 7',
      error:   'M6 18L18 6M6 6l12 12',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    }[type];
  }
}
