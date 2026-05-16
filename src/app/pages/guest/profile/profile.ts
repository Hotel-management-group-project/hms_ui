
import { Component, inject, OnInit, signal, afterNextRender, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { User } from '../../../core/models';
import gsap from 'gsap';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private el = inject(ElementRef);

  readonly updatingProfile = signal(false);
  readonly updatingPassword = signal(false);
  readonly showCurrentPw = signal(false);
  readonly showNewPw = signal(false);
  readonly showConfirmPw = signal(false);

  readonly profileForm = this.fb.group({
    firstName:   ['', Validators.required],
    lastName:    ['', Validators.required],
    email:       [{ value: '', disabled: true }],
    phoneNumber: [''],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const host = this.el.nativeElement as HTMLElement;
      gsap.from(host.querySelectorAll('.gsap-reveal'), {
        opacity: 0,
        y: 28,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'all',
      });
    });
  }

  passwordMatchValidator(g: any) {
    return g.get('newPassword').value === g.get('confirmPassword').value
      ? null : { mismatch: true };
  }

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
      });
    }
  }

  get initials(): string {
    const u = this.auth.currentUser();
    if (!u) return 'U';
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  }

  updateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const user = this.auth.currentUser();
    if (!user) return;

    this.updatingProfile.set(true);
    const raw = this.profileForm.getRawValue();
    const data: Partial<User> = {
      firstName:   raw.firstName   || undefined,
      lastName:    raw.lastName    || undefined,
      email:       raw.email       || undefined,
      phoneNumber: raw.phoneNumber || undefined,
    };

    this.userService.updateProfile(user.id, data).subscribe({
      next: () => {
        this.updatingProfile.set(false);
        this.toast.success('Profile updated successfully.');
      },
      error: (err: unknown) => {
        console.error(err);
        this.updatingProfile.set(false);
        this.toast.error('Failed to update profile.');
      },
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.updatingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.updatingPassword.set(false);
        this.toast.success('Password changed successfully.');
        this.passwordForm.reset();
      },
      error: (err: unknown) => {
        console.error(err);
        this.updatingPassword.set(false);
        this.toast.error('Failed to change password. Please check your current password.');
      },
    });
  }
}
