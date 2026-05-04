// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { User } from '../../../core/models';

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

  readonly updatingProfile = signal(false);
  readonly updatingPassword = signal(false);

  readonly profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    phoneNumber: ['']
  });

  readonly passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: any) {
    return g.get('newPassword').value === g.get('confirmPassword').value
      ? null : { mismatch: true };
  }

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        // user object might not have phone if it's not in JWT, 
        // but we'd normally fetch full profile. For now we use what we have.
      });
    }
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
      firstName: raw.firstName || undefined,
      lastName: raw.lastName || undefined,
      email: raw.email || undefined,
      phoneNumber: raw.phoneNumber || undefined
    };

    this.userService.updateProfile(user.id, data).subscribe({
      next: (updatedUser) => {
        this.updatingProfile.set(false);
        this.toast.success('Profile updated successfully.');
        // Update local auth state if necessary
      },
      error: (err: unknown) => {
        console.error(err);
        this.updatingProfile.set(false);
        this.toast.error('Failed to update profile.');
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.updatingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;

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
      }
    });
  }
}
