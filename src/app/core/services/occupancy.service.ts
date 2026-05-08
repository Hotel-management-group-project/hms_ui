// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

export interface OccupancyStats {
  totalRooms: number;
  available: number;
  occupied: number;
  cleaning: number;
  outOfService: number;
  occupancyRate: number;
}

export interface ArrivalItem {
  bookingId: string;
  referenceNumber: string;
  guestName: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
}

export interface DepartureItem {
  bookingId: string;
  referenceNumber: string;
  guestName: string;
  roomNumber: string;
  roomType: string;
  checkOutDate: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class OccupancyService implements OnDestroy {
  private hub: signalR.HubConnection;

  readonly stats = signal<OccupancyStats>({
    totalRooms: 0,
    available: 0,
    occupied: 0,
    cleaning: 0,
    outOfService: 0,
    occupancyRate: 0,
  });

  readonly todayArrivals = signal<ArrivalItem[]>([]);
  readonly todayDepartures = signal<DepartureItem[]>([]);
  readonly connected = signal(false);
  readonly connecting = signal(false);

  readonly arrivalsCount = computed(() => this.todayArrivals().length);
  readonly departuresCount = computed(() => this.todayDepartures().length);

  constructor() {
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.signalRUrl}/occupancy`, {
        accessTokenFactory: () => localStorage.getItem('access_token') ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hub.on('ReceiveOccupancyUpdate', (data: OccupancyStats) => {
      this.stats.set(data);
    });

    this.hub.on('TodayArrivals', (data: ArrivalItem[]) => {
      this.todayArrivals.set(data);
    });

    this.hub.on('TodayDepartures', (data: DepartureItem[]) => {
      this.todayDepartures.set(data);
    });

    this.hub.onreconnecting(() => this.connected.set(false));
    this.hub.onreconnected(() => this.connected.set(true));
    this.hub.onclose(() => this.connected.set(false));
  }

  async connect(): Promise<void> {
    if (this.hub.state !== signalR.HubConnectionState.Disconnected) return;
    this.connecting.set(true);
    try {
      await this.hub.start();
      this.connected.set(true);
      // Request initial data push from hub
      await this.hub.invoke('RequestOccupancyUpdate').catch(() => {});
    } catch (err) {
      console.error('SignalR connection failed:', err);
    } finally {
      this.connecting.set(false);
    }
  }

  async disconnect(): Promise<void> {
    await this.hub.stop();
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.hub.stop();
  }
}
