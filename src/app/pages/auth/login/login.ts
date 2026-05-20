// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, signal, afterNextRender, ElementRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { InactivityService } from '../../../core/services/inactivity.service';
import { ToastService } from '../../../shared/components/toast/toast';
import gsap from 'gsap';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private inactivity = inject(InactivityService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private el = inject(ElementRef);

  readonly loading = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

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

  private extractError(err: unknown): string {
    const e = err as { error?: { message?: string }; status?: number };
    if (e?.error?.message) return e.error.message;
    if (e?.status === 423) return 'Account locked. Please try again in 15 minutes.';
    if (e?.status === 401) return 'Invalid email or password.';
    if (e?.status === 0) return 'Cannot connect to server.';
    return 'Login failed. Please try again.';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.inactivity.start();
        this.toast.success('Welcome back!');
        const destination = res.requiresPasswordChange
          ? '/auth/change-password'
          : this.auth.getRoleDashboard();
        this.router.navigate([destination]);
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
