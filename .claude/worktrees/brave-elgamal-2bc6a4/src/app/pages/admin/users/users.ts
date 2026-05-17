// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService, CreateUserRequest } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { User, UserRole } from '../../../core/models';

const PAGE_SIZE = 15;

@Component({
  selector: 'app-admin-users',
  imports: [RouterLink, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './users.html',
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly allUsers = signal<User[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  // Filters
  searchQuery = '';
  readonly filterRole = signal<UserRole | 'all'>('all');
  readonly filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  readonly page = signal(1);

  // Create modal
  readonly showCreateModal = signal(false);
  readonly creating = signal(false);

  // Delete modal
  readonly showDeleteModal = signal(false);
  readonly deletingId = signal<string | null>(null);
  userToDelete: User | null = null;

  // Inline actions
  readonly togglingId = signal<string | null>(null);
  readonly editingRoleId = signal<string | null>(null);
  editingRoleValue: UserRole = 'Guest';

  readonly roles: UserRole[] = ['Guest', 'FrontDesk', 'Manager', 'Admin'];
  readonly PAGE_SIZE = PAGE_SIZE;

  readonly createForm = this.fb.group({
    firstName:   ['', [Validators.required, Validators.minLength(2)]],
    lastName:    ['', [Validators.required, Validators.minLength(2)]],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(8)]],
    role:        ['Guest' as UserRole, Validators.required],
    phoneNumber: [''],
  });

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery.toLowerCase();
    const role = this.filterRole();
    const status = this.filterStatus();
    return this.allUsers().filter(u => {
      const matchRole   = role === 'all' || u.role === role;
      const matchStatus = status === 'all' || (status === 'active' ? u.isActive : !u.isActive);
      const matchSearch = !q
        || u.firstName.toLowerCase().includes(q)
        || u.lastName.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q);
      return matchRole && matchStatus && matchSearch;
    });
  });

  readonly paginatedUsers = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filteredUsers().slice(start, start + PAGE_SIZE);
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / PAGE_SIZE))
  );

  get pageStart(): number { return (this.page() - 1) * PAGE_SIZE + 1; }
  get pageEnd(): number   { return Math.min(this.page() * PAGE_SIZE, this.filteredUsers().length); }

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set('');
    this.userService.getAll().subscribe({
      next: users => { this.allUsers.set(users); this.loading.set(false); },
      error: () => { this.error.set('Failed to load users.'); this.loading.set(false); },
    });
  }

  resetPage(): void { this.page.set(1); }

  // ── Create ────────────────────────────────────────────

  openCreate(): void {
    this.createForm.reset({ role: 'Guest' });
    this.showCreateModal.set(true);
  }

  closeCreate(): void { this.showCreateModal.set(false); }

  createUser(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.creating.set(true);
    const v = this.createForm.getRawValue();
    const payload: CreateUserRequest = {
      firstName: v.firstName!, lastName: v.lastName!, email: v.email!,
      password: v.password!, role: v.role as UserRole,
      phoneNumber: v.phoneNumber || undefined,
    };
    this.userService.adminCreate(payload).subscribe({
      next: user => {
        this.allUsers.update(list => [user, ...list]);
        this.creating.set(false);
        this.showCreateModal.set(false);
        this.toast.success(`${user.firstName} ${user.lastName} created as ${user.role}.`);
      },
      error: err => {
        this.creating.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to create user.');
      },
    });
  }

  // ── Delete ────────────────────────────────────────────

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void { this.showDeleteModal.set(false); this.userToDelete = null; }

  deleteUser(): void {
    if (!this.userToDelete) return;
    const user = this.userToDelete;
    this.deletingId.set(user.id);
    this.userService.delete(user.id).subscribe({
      next: () => {
        this.allUsers.update(list => list.filter(u => u.id !== user.id));
        this.deletingId.set(null);
        this.showDeleteModal.set(false);
        this.userToDelete = null;
        this.toast.success(`${user.firstName} ${user.lastName} deleted.`);
      },
      error: () => { this.deletingId.set(null); this.toast.error('Failed to delete user.'); },
    });
  }

  // ── Toggle Active ─────────────────────────────────────

  toggleActive(user: User): void {
    this.togglingId.set(user.id);
    this.userService.setActive(user.id, !user.isActive).subscribe({
      next: updated => {
        this.allUsers.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.togglingId.set(null);
        this.toast.success(`${updated.firstName} ${updated.isActive ? 'activated' : 'deactivated'}.`);
      },
      error: () => { this.togglingId.set(null); this.toast.error('Failed to update user.'); },
    });
  }

  // ── Edit Role ─────────────────────────────────────────

  startEditRole(user: User): void {
    this.editingRoleId.set(user.id);
    this.editingRoleValue = user.role;
  }

  cancelEditRole(): void { this.editingRoleId.set(null); }

  saveRole(user: User): void {
    if (this.editingRoleValue === user.role) { this.editingRoleId.set(null); return; }
    this.userService.updateProfile(user.id, { role: this.editingRoleValue }).subscribe({
      next: updated => {
        this.allUsers.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.editingRoleId.set(null);
        this.toast.success(`Role updated to ${updated.role}.`);
      },
      error: () => this.toast.error('Failed to update role.'),
    });
  }

  // ── Pagination ────────────────────────────────────────

  prevPage(): void { if (this.page() > 1) this.page.update(p => p - 1); }
  nextPage(): void { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }

  // ── Helpers ───────────────────────────────────────────

  fieldError(field: string, code: string): boolean {
    const c = this.createForm.get(field);
    return !!(c?.touched && c.errors?.[code]);
  }

  roleClass(role: string): string {
    const map: Record<string, string> = {
      Admin:     'text-red-400 border-red-400/20 bg-red-400/10',
      Manager:   'text-gold-400 border-gold-400/20 bg-gold-400/10',
      FrontDesk: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
      Guest:     'text-ink-2/60 border-rim-2 bg-raised/50',
    };
    return map[role] ?? map['Guest'];
  }

  initials(user: User): string {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
}
