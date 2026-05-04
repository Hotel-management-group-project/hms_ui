// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { RoomService } from '../../../core/services/room.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Room, RoomStatus } from '../../../core/models';

type ViewMode = 'table' | 'board';

const STATUS_ORDER: RoomStatus[] = ['Available', 'Occupied', 'Cleaning', 'OutOfService'];

@Component({
  selector: 'app-room-management',
  imports: [RouterLink, DragDropModule],
  templateUrl: './room-management.html',
})
export class RoomManagementComponent implements OnInit {
  private roomService = inject(RoomService);
  private toast = inject(ToastService);

  readonly rooms = signal<Room[]>([]);
  readonly loading = signal(true);
  readonly view = signal<ViewMode>('table');
  readonly filterStatus = signal<RoomStatus | 'All'>('All');
  readonly filterType = signal<string>('All');

  readonly statusColumns: RoomStatus[] = STATUS_ORDER;

  readonly filteredRooms = computed(() => {
    let list = this.rooms();
    if (this.filterStatus() !== 'All') {
      list = list.filter(r => r.status === this.filterStatus());
    }
    if (this.filterType() !== 'All') {
      list = list.filter(r => r.type === this.filterType());
    }
    return list;
  });

  // Board columns derived from rooms (for CDK drag-drop)
  readonly available  = computed(() => this.rooms().filter(r => r.status === 'Available'));
  readonly occupied   = computed(() => this.rooms().filter(r => r.status === 'Occupied'));
  readonly cleaning   = computed(() => this.rooms().filter(r => r.status === 'Cleaning'));
  readonly outOfService = computed(() => this.rooms().filter(r => r.status === 'OutOfService'));

  // Mutable arrays fed to CDK drag-drop (kept in sync with the signal)
  boardColumns: { status: RoomStatus; rooms: Room[] }[] = [];

  ngOnInit(): void {
    this.fetchRooms();
  }

  fetchRooms(): void {
    this.loading.set(true);
    this.roomService.search({}).subscribe({
      next: (data) => {
        this.rooms.set(data);
        this.rebuildBoard(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.toast.error('Failed to load rooms.');
        this.loading.set(false);
      }
    });
  }

  private rebuildBoard(rooms: Room[]): void {
    this.boardColumns = STATUS_ORDER.map(status => ({
      status,
      rooms: rooms.filter(r => r.status === status),
    }));
  }

  setView(v: ViewMode): void {
    this.view.set(v);
    if (v === 'board') {
      this.rebuildBoard(this.rooms());
    }
  }

  // ── Inline Status Update (table mode) ────────────────
  updateStatus(room: Room, newStatus: RoomStatus): void {
    if (room.status === newStatus) return;
    this.roomService.update(room.id, { status: newStatus }).subscribe({
      next: (updated) => {
        this.rooms.update(list => list.map(r => r.id === updated.id ? updated : r));
        this.rebuildBoard(this.rooms());
        this.toast.success(`Room ${room.roomNumber} → ${newStatus}`);
      },
      error: (err: unknown) => {
        console.error(err);
        this.toast.error('Failed to update room status.');
      }
    });
  }

  // ── CDK Drag-Drop (board mode) ────────────────────────
  onDrop(event: CdkDragDrop<Room[]>, targetStatus: RoomStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const room: Room = event.previousContainer.data[event.previousIndex];
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    // Persist the status change
    this.roomService.update(room.id, { status: targetStatus }).subscribe({
      next: (updated) => {
        this.rooms.update(list => list.map(r => r.id === updated.id ? updated : r));
        this.toast.success(`Room ${room.roomNumber} moved to ${targetStatus}`);
      },
      error: (err: unknown) => {
        console.error(err);
        this.toast.error('Failed to move room. Refreshing...');
        this.fetchRooms();
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────
  readonly roomTypes = ['All', 'Standard Double', 'Deluxe King', 'Family Suite', 'Penthouse'];
  readonly statusOptions: RoomStatus[] = STATUS_ORDER;

  statusBadge(status: RoomStatus): string {
    return {
      Available:    'text-green-400 border-green-400/20 bg-green-400/10',
      Occupied:     'text-blue-400 border-blue-400/20 bg-blue-400/10',
      Cleaning:     'text-amber-400 border-amber-400/20 bg-amber-400/10',
      OutOfService: 'text-red-400 border-red-400/20 bg-red-400/10',
    }[status];
  }

  columnHeader(status: RoomStatus): { label: string; dot: string } {
    return {
      Available:    { label: 'Available',      dot: 'bg-green-400' },
      Occupied:     { label: 'Occupied',        dot: 'bg-blue-400' },
      Cleaning:     { label: 'Cleaning',        dot: 'bg-amber-400' },
      OutOfService: { label: 'Out of Service',  dot: 'bg-red-400' },
    }[status];
  }

  columnDropId(status: RoomStatus): string {
    return `col-${status}`;
  }

  allDropIds(): string[] {
    return STATUS_ORDER.map(s => this.columnDropId(s));
  }

  countByStatus(status: RoomStatus): number {
    return this.rooms().filter(r => r.status === status).length;
  }
}
