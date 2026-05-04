import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { InactivityService } from '../../../core/services/inactivity.service';
import { ToastService } from '../../../shared/components/toast/toast';

/**
 * Custom validator: password must contain uppercase, lowercase, digit,
 * and special character (HMS security policy — CLAUDE.md).
 */
function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value || '';
  const errors: ValidationErrors = {};
  if (!/[A-Z]/.test(v)) errors['noUppercase'] = true;
  if (!/[a-z]/.test(v)) errors['noLowercase'] = true;
  if (!/\d/.test(v))    errors['noDigit'] = true;
  if (!/[^A-Za-z0-9]/.test(v)) errors['noSpecial'] = true;
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private inactivity = inject(InactivityService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8), passwordStrength]],
  });

  /** Password strength indicator (0–4 bars). */
  get strengthBars(): boolean[] {
    const ctrl = this.form.controls.password;
    const v = ctrl.value || '';
    if (v.length === 0) return [false, false, false, false];
    return [
      /[a-z]/.test(v),
      /[A-Z]/.test(v),
      /\d/.test(v),
      /[^A-Za-z0-9]/.test(v),
    ];
  }

  private extractError(err: unknown): string {
    const e = err as { error?: { message?: string }; status?: number };
    if (e?.error?.message) return e.error.message;
    if (e?.status === 409) return 'An account with this email already exists.';
    if (e?.status === 0) return 'Cannot connect to server.';
    return 'Registration failed. Please try again.';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.inactivity.start();
        this.toast.success('Account created! Welcome to HMS.');
        this.router.navigate([this.auth.getRoleDashboard()]);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(this.extractError(err));
      },
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
