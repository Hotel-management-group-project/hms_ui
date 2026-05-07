// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, signal, afterNextRender, ElementRef } from '@angular/core';
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
import gsap from 'gsap';

function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value || '';
  const errors: ValidationErrors = {};
  if (!/[A-Z]/.test(v)) errors['noUppercase'] = true;
  if (!/[a-z]/.test(v)) errors['noLowercase'] = true;
  if (!/\d/.test(v))    errors['noDigit'] = true;
  if (!/[^A-Za-z0-9]/.test(v)) errors['noSpecial'] = true;
  return Object.keys(errors).length ? errors : null;
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
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
  private el = inject(ElementRef);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      firstName:       ['', [Validators.required, Validators.minLength(2)]],
      lastName:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      phoneNumber:     [''],
      password:        ['', [Validators.required, Validators.minLength(8), passwordStrength]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const root = this.el.nativeElement as HTMLElement;
      gsap.from(root.querySelectorAll('.gsap-reveal'), {
        opacity: 0,
        y: 28,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'all',
      });
    });
  }

  get strengthBars(): boolean[] {
    const v = this.form.controls.password.value || '';
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
    const { firstName, lastName, email, password, phoneNumber } = this.form.getRawValue();

    this.auth.register({ firstName, lastName, email, password, phoneNumber }).subscribe({
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

  toggleConfirm(): void {
    this.showConfirm.update(v => !v);
  }
}
