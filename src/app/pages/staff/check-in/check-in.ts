// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CheckInService } from '../../../core/services/checkin.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Booking } from '../../../core/models';

type Mode = 'qr' | 'manual';
type ScanState = 'idle' | 'scanning' | 'scanned' | 'error';

@Component({
  selector: 'app-check-in',
  imports: [ReactiveFormsModule, RouterLink, ZXingScannerModule],
  templateUrl: './check-in.html',
})
export class CheckInComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private checkInService = inject(CheckInService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly mode = signal<Mode>('manual');
  readonly scanState = signal<ScanState>('idle');
  readonly loading = signal(false);
  readonly confirming = signal(false);

  readonly booking = signal<Booking | null>(null);
  readonly checkedIn = signal(false);
  readonly error = signal<string | null>(null);

  // QR scanner
  readonly scannerEnabled = signal(false);
  readonly availableDevices = signal<MediaDeviceInfo[]>([]);
  readonly selectedDevice = signal<MediaDeviceInfo | undefined>(undefined);

  // Manual lookup form
  readonly refForm = this.fb.group({
    referenceNumber: ['', [Validators.required, Validators.pattern(/^HMS-\d{4}-\d{5}$/)]]
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const mode = params.get('mode');
      const ref = params.get('ref');

      if (mode === 'qr') {
        this.setMode('qr');
      }

      if (ref) {
        this.refForm.patchValue({ referenceNumber: ref });
        this.lookupByReference();
      }
    });
  }

  setMode(m: Mode): void {
    this.mode.set(m);
    this.booking.set(null);
    this.error.set(null);
    this.checkedIn.set(false);
    this.scanState.set('idle');
    if (m === 'qr') {
      this.scannerEnabled.set(true);
    } else {
      this.scannerEnabled.set(false);
    }
  }

  // ── QR Scanner ─────────────────────────────────────

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices.set(devices);
    if (devices.length > 0) {
      // Prefer rear camera
      const rear = devices.find(d => /back|rear|environment/i.test(d.label));
      this.selectedDevice.set(rear ?? devices[0]);
    }
  }

  onScanSuccess(qrData: string): void {
    if (this.scanState() === 'scanning' || this.scanState() === 'scanned') return;
    this.scanState.set('scanning');
    this.scannerEnabled.set(false);

    this.checkInService.scanQr(qrData).subscribe({
      next: (b) => {
        this.booking.set(b);
        this.scanState.set('scanned');
        this.error.set(null);
      },
      error: (err: unknown) => {
        console.error(err);
        this.scanState.set('error');
        this.error.set('Invalid QR code or booking not found.');
        this.scannerEnabled.set(true);
      }
    });
  }

  resetScan(): void {
    this.booking.set(null);
    this.scanState.set('idle');
    this.error.set(null);
    this.checkedIn.set(false);
    this.scannerEnabled.set(true);
  }

  // ── Manual Lookup ──────────────────────────────────

  lookupByReference(): void {
    if (this.refForm.invalid) {
      this.refForm.markAllAsTouched();
      return;
    }

    const ref = this.refForm.value.referenceNumber!.toUpperCase().trim();
    this.loading.set(true);
    this.booking.set(null);
    this.error.set(null);
    this.checkedIn.set(false);

    this.checkInService.findByReference(ref).subscribe({
      next: (bookings) => {
        this.loading.set(false);
        const match = bookings.find(b => b.referenceNumber === ref);
        if (match) {
          this.booking.set(match);
        } else {
          this.error.set('No booking found with that reference number.');
        }
      },
      error: (err: unknown) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('Failed to look up booking. Please try again.');
      }
    });
  }

  // ── Confirm Check-In ───────────────────────────────

  confirmCheckIn(): void {
    const b = this.booking();
    if (!b) return;

    if (b.status === 'CheckedIn') {
      this.toast.warning('Guest is already checked in.');
      return;
    }

    this.confirming.set(true);
    this.checkInService.confirmCheckIn(b.id).subscribe({
      next: () => {
        this.confirming.set(false);
        this.checkedIn.set(true);
        this.toast.success(`Check-in confirmed for ${b.referenceNumber}.`);
        // Update local booking status
        this.booking.update(bk => bk ? { ...bk, status: 'CheckedIn' } : bk);
      },
      error: (err: unknown) => {
        console.error(err);
        this.confirming.set(false);
        this.toast.error('Check-in failed. Please try again.');
      }
    });
  }

  get nights(): number {
    const b = this.booking();
    if (!b) return 0;
    return Math.max(1, Math.ceil(
      (new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86400000
    ));
  }

  statusClass(status: string): string {
    return {
      Confirmed:  'text-blue-400 border-blue-400/20 bg-blue-400/10',
      CheckedIn:  'text-green-400 border-green-400/20 bg-green-400/10',
      Pending:    'text-amber-400 border-amber-400/20 bg-amber-400/10',
      Cancelled:  'text-red-400 border-red-400/20 bg-red-400/10',
    }[status] ?? 'text-cream-300 border-navy-600 bg-navy-700';
  }
}
