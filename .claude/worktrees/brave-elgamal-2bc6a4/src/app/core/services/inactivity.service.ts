import { Injectable, inject, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from '../../shared/components/toast/toast';

/**
 * Monitors user activity and triggers automatic logout after 15 minutes
 * of inactivity. Required by HMS security policy (CLAUDE.md).
 *
 * Listens to mouse, keyboard, scroll, and touch events. Resets the
 * countdown on any activity. Runs the timer outside Angular zone to
 * avoid unnecessary change detection cycles.
 */
@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private zone = inject(NgZone);

  private readonly TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  private readonly WARNING_MS = 13 * 60 * 1000; // warn at 13 min (2 min before)
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private warningId: ReturnType<typeof setTimeout> | null = null;
  private boundReset = this.resetTimer.bind(this);
  private started = false;

  private readonly EVENTS: (keyof DocumentEventMap)[] = [
    'mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart',
  ];

  /** Start monitoring — call once after login or session restore. */
  start(): void {
    if (this.started) return;
    this.started = true;

    // Run outside zone so timer ticks don't trigger change detection
    this.zone.runOutsideAngular(() => {
      this.EVENTS.forEach(evt =>
        document.addEventListener(evt, this.boundReset, { passive: true }),
      );
      this.scheduleTimers();
    });
  }

  /** Stop monitoring — call on logout. */
  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.clearTimers();
    this.EVENTS.forEach(evt =>
      document.removeEventListener(evt, this.boundReset),
    );
  }

  ngOnDestroy(): void {
    this.stop();
  }

  // ── Private ────────────────────────────────────────

  private resetTimer(): void {
    this.clearTimers();
    this.scheduleTimers();
  }

  private scheduleTimers(): void {
    // Warning toast 2 minutes before logout
    this.warningId = setTimeout(() => {
      this.zone.run(() => {
        this.toast.warning('You will be logged out in 2 minutes due to inactivity.');
      });
    }, this.WARNING_MS);

    // Actual logout
    this.timerId = setTimeout(() => {
      this.zone.run(() => {
        this.toast.info('You have been logged out due to inactivity.');
        this.auth.logout();
        this.stop();
      });
    }, this.TIMEOUT_MS);
  }

  private clearTimers(): void {
    if (this.warningId) { clearTimeout(this.warningId); this.warningId = null; }
    if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
  }
}
