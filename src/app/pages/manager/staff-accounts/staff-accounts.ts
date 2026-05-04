// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService, CreateStaffRequest } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { User } from '../../../core/models';

@Component({
  selector: 'app-staff-accounts',
  imports: [FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './staff-accounts.html',
})
export class StaffAccountsComponent implements OnInit {
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly staff = signal<User[]>([]);
  readonly loading = signal(false);
  readonly showModal = signal(false);
  readonly creating = signal(false);
  readonly error = signal('');
  readonly filterRole = signal<'all' | 'FrontDesk' | 'Manager'>('all');
  readonly togglingId = signal<string | null>(null);

  readonly form = this.fb.group({
    firstName:   ['', [Validators.required, Validators.minLength(2)]],
    lastName:    ['', [Validators.required, Validators.minLength(2)]],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(8)]],
    role:        ['FrontDesk' as 'FrontDesk' | 'Manager', Validators.required],
    phoneNumber: [''],
  });

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.loading.set(true);
    this.error.set('');
    this.userService.getAll().subscribe({
      next: users => {
        const staffOnly = users.filter(u => u.role === 'FrontDesk' || u.role === 'Manager');
        this.staff.set(staffOnly);
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load staff accounts.'); this.loading.set(false); },
    });
  }

  get filteredStaff(): User[] {
    const r = this.filterRole();
    return r === 'all' ? this.staff() : this.staff().filter(u => u.role === r);
  }

  openModal(): void {
    this.form.reset({ role: 'FrontDesk' });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  createStaff(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.creating.set(true);
    const v = this.form.getRawValue();
    const payload: CreateStaffRequest = {
      firstName:   v.firstName!,
      lastName:    v.lastName!,
      email:       v.email!,
      password:    v.password!,
      role:        v.role as 'FrontDesk' | 'Manager',
      phoneNumber: v.phoneNumber || undefined,
    };

    this.userService.create(payload).subscribe({
      next: user => {
        this.staff.update(list => [user, ...list]);
        this.creating.set(false);
        this.showModal.set(false);
        this.toast.show(`${user.firstName} ${user.lastName} created as ${user.role}.`, 'success');
      },
      error: (err) => {
        this.creating.set(false);
        const msg = err?.error?.message ?? 'Failed to create account.';
        this.toast.show(msg, 'error');
      },
    });
  }

  toggleActive(user: User): void {
    this.togglingId.set(user.id);
    this.userService.setActive(user.id, !user.isActive).subscribe({
      next: updated => {
        this.staff.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.togglingId.set(null);
        this.toast.show(
          `${updated.firstName} ${updated.lastName} ${updated.isActive ? 'activated' : 'deactivated'}.`,
          updated.isActive ? 'success' : 'info',
        );
      },
      error: () => { this.togglingId.set(null); this.toast.show('Failed to update account.', 'error'); },
    });
  }

  fieldError(field: string, code: string): boolean {
    const c = this.form.get(field);
    return !!(c?.touched && c.errors?.[code]);
  }

  roleClass(role: string): string {
    return role === 'Manager'
      ? 'text-gold-400 border-gold-400/20 bg-gold-400/10'
      : 'text-blue-400 border-blue-400/20 bg-blue-400/10';
  }
}
