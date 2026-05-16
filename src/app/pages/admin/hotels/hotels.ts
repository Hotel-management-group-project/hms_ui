
import { Component, inject, OnInit, signal, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import gsap from 'gsap';
import { HotelService, CreateHotelRequest } from '../../../core/services/hotel.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Hotel } from '../../../core/models';

@Component({
  selector: 'app-admin-hotels',
  imports: [RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './hotels.html',
})
export class AdminHotelsComponent implements OnInit {
  private hotelService = inject(HotelService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly hotels = signal<Hotel[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  // Add/Edit modal
  readonly showModal = signal(false);
  readonly saving = signal(false);
  editingHotel: Hotel | null = null;

  // Delete modal
  readonly showDeleteModal = signal(false);
  readonly deletingId = signal<string | null>(null);
  hotelToDelete: Hotel | null = null;

  // Toggle
  readonly togglingId = signal<string | null>(null);

  readonly hotelForm = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2)]],
    location:    ['', Validators.required],
    address:     ['', Validators.required],
    description: [''],
    imageUrl:    [''],
  });

  constructor() {
    afterNextRender(() => {
      this.animateCards();
    });
  }

  ngOnInit(): void { this.loadHotels(); }

  private animateCards(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setTimeout(() => {
      gsap.from('.gsap-hotel-card', {
        y: 24, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', clearProps: 'all',
      });
    }, 40);
  }

  loadHotels(): void {
    this.loading.set(true);
    this.error.set('');
    this.hotelService.getHotels().subscribe({
      next: hotels => {
        this.hotels.set(hotels);
        this.loading.set(false);
        this.animateCards();
      },
      error: () => { this.error.set('Failed to load hotels.'); this.loading.set(false); },
    });
  }

  // ── Add / Edit ────────────────────────────────────────

  openAdd(): void {
    this.editingHotel = null;
    this.hotelForm.reset();
    this.showModal.set(true);
  }

  openEdit(hotel: Hotel): void {
    this.editingHotel = hotel;
    this.hotelForm.patchValue({
      name: hotel.name,
      location: hotel.location,
      address: hotel.address,
      description: hotel.description,
      imageUrl: hotel.imageUrl,
    });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editingHotel = null; }

  save(): void {
    if (this.hotelForm.invalid) { this.hotelForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.hotelForm.getRawValue();
    const data: CreateHotelRequest = {
      name: v.name!,
      location: v.location!,
      address: v.address!,
      description: v.description || '',
      imageUrl: v.imageUrl || '',
    };

    const op$ = this.editingHotel
      ? this.hotelService.update(this.editingHotel.id, data)
      : this.hotelService.create(data);

    op$.subscribe({
      next: hotel => {
        if (this.editingHotel) {
          this.hotels.update(list => list.map(h => h.id === hotel.id ? hotel : h));
          this.toast.success(`${hotel.name} updated.`);
        } else {
          this.hotels.update(list => [hotel, ...list]);
          this.toast.success(`${hotel.name} added.`);
          this.animateCards();
        }
        this.saving.set(false);
        this.closeModal();
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to save hotel.');
      },
    });
  }

  // ── Toggle Active ─────────────────────────────────────

  toggleActive(hotel: Hotel): void {
    this.togglingId.set(hotel.id);
    this.hotelService.update(hotel.id, { isActive: !hotel.isActive }).subscribe({
      next: updated => {
        this.hotels.update(list => list.map(h => h.id === updated.id ? updated : h));
        this.togglingId.set(null);
        this.toast.success(`${updated.name} ${updated.isActive ? 'activated' : 'deactivated'}.`);
      },
      error: () => { this.togglingId.set(null); this.toast.error('Failed to update hotel.'); },
    });
  }

  // ── Delete ────────────────────────────────────────────

  confirmDelete(hotel: Hotel): void {
    this.hotelToDelete = hotel;
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void { this.showDeleteModal.set(false); this.hotelToDelete = null; }

  deleteHotel(): void {
    if (!this.hotelToDelete) return;
    const hotel = this.hotelToDelete;
    this.deletingId.set(hotel.id);
    this.hotelService.delete(hotel.id).subscribe({
      next: () => {
        this.hotels.update(list => list.filter(h => h.id !== hotel.id));
        this.deletingId.set(null);
        this.showDeleteModal.set(false);
        this.hotelToDelete = null;
        this.toast.success(`${hotel.name} deleted.`);
      },
      error: () => { this.deletingId.set(null); this.toast.error('Failed to delete hotel.'); },
    });
  }

  // ── Helpers ───────────────────────────────────────────

  fieldError(field: string, code: string): boolean {
    const c = this.hotelForm.get(field);
    return !!(c?.touched && c.errors?.[code]);
  }

  get modalTitle(): string {
    return this.editingHotel ? 'Edit Hotel' : 'Add New Hotel';
  }
}
