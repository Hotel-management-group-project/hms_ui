// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const newPw = parent.get('newPassword')?.value;
  return control.value === newPw ? null : { mismatch: true };
}

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.html',
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly loading = signal(false);
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)]],
    confirmPassword: ['', [Validators.required, passwordMatch]],
  });

  get user() { return this.authService.currentUser(); }

  submit() {
    this.form.get('confirmPassword')?.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { currentPassword, newPassword } = this.form.getRawValue();

    this.userService.changePassword({ currentPassword: currentPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Password changed successfully. Please log in again.');
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toast.error('Failed to change password. Please check your current password.');
        console.error(err);
      },
    });
  }

  skip() {
    this.router.navigate([this.authService.getRoleDashboard()]);
  }
}
