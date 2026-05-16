
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WaitlistService } from '../../../core/services/waitlist.service';
import { ToastService } from '../toast/toast';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-waitlist-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './waitlist-modal.html',
})
export class WaitlistModalComponent {
  @Input() hotelId: string = '';
  @Input() roomType: string = '';
  @Input() checkInDate: string = '';
  @Input() checkOutDate: string = '';
  
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private waitlistService = inject(WaitlistService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  readonly loading = signal(false);

  // Read-only form just to display the values they are waitlisting for,
  // or allow them to confirm. We use a form to handle submission cleanly.
  readonly form = this.fb.group({
    agreeToTerms: [false, Validators.requiredTrue]
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      this.toast.error('You must be logged in to join the waitlist.');
      return;
    }

    this.loading.set(true);

    this.waitlistService.joinWaitlist({
      hotelId: parseInt(this.hotelId, 10),
      roomType: this.roomType.replace(/ /g, ''),
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('You have been added to the waitlist!');
        this.close.emit();
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toast.error('Failed to join waitlist. Please try again.');
        console.error(err);
      }
    });
  }
}
