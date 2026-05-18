// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MyBookingsComponent } from './my-bookings';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Booking } from '../../../core/models';

// Returns an ISO date string N days from now
const daysFromNow = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

// Sample bookings covering all three cancellation tiers
const mockBookings: Booking[] = [
  // > 14 days away → free cancellation
  {
    id: 'b-free',
    guestId: 'g1',
    hotelId: 'h1',
    referenceNumber: 'HMS-2025-00001',
    checkInDate: daysFromNow(20),
    checkOutDate: daysFromNow(23),
    totalPrice: 360,
    status: 'Confirmed',
    rooms: [
      { roomId: 'r1', roomNumber: '101', roomType: 'Standard Double', floor: 1, pricePerNight: 120 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 3–14 days away → 50 % of first night
  {
    id: 'b-half',
    guestId: 'g1',
    hotelId: 'h1',
    referenceNumber: 'HMS-2025-00002',
    checkInDate: daysFromNow(7),
    checkOutDate: daysFromNow(9),
    totalPrice: 240,
    status: 'Confirmed',
    rooms: [
      { roomId: 'r1', roomNumber: '101', roomType: 'Standard Double', floor: 1, pricePerNight: 120 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // < 72 hours away → 100 % of first night
  {
    id: 'b-full',
    guestId: 'g1',
    hotelId: 'h1',
    referenceNumber: 'HMS-2025-00003',
    checkInDate: daysFromNow(1),
    checkOutDate: daysFromNow(3),
    totalPrice: 360,
    status: 'Confirmed',
    rooms: [
      { roomId: 'r1', roomNumber: '101', roomType: 'Standard Double', floor: 1, pricePerNight: 120 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('MyBookingsComponent — guest portal', () => {
  let fixture: ComponentFixture<MyBookingsComponent>;
  let component: MyBookingsComponent;
  let mockBookingService: {
    getMyBookings: ReturnType<typeof vi.fn>;
    cancelBooking: ReturnType<typeof vi.fn>;
    getQrCode: ReturnType<typeof vi.fn>;
    downloadInvoice: ReturnType<typeof vi.fn>;
  };
  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockBookingService = {
      getMyBookings: vi.fn().mockReturnValue(of(mockBookings)),
      cancelBooking: vi.fn().mockReturnValue(of({})),
      getQrCode: vi.fn().mockReturnValue(of({ qrCodeUrl: 'https://example.com/qr.png' })),
      downloadInvoice: vi.fn().mockReturnValue(of(new Blob(['pdf'], { type: 'application/pdf' }))),
    };
    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MyBookingsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BookingService, useValue: mockBookingService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Component loads and calls the service ───────────────────────────────

  it('calls BookingService.getMyBookings() on initialisation', () => {
    expect(mockBookingService.getMyBookings).toHaveBeenCalledTimes(1);
  });

  // ── Bookings list renders correctly ─────────────────────────────────────

  it('stores all returned bookings and surfaces them as upcoming', () => {
    expect(component.bookings()).toHaveLength(3);
    expect(component.upcomingBookings()).toHaveLength(3);
  });

  it('renders booking reference numbers in the template', () => {
    fixture.detectChanges();
    const html: string = fixture.nativeElement.innerHTML;
    expect(html).toContain('HMS-2025-00001');
    expect(html).toContain('HMS-2025-00002');
    expect(html).toContain('HMS-2025-00003');
  });

  // ── Cancellation fee policy ─────────────────────────────────────────────

  it('returns free cancellation for bookings more than 14 days away', () => {
    const booking = mockBookings.find(b => b.id === 'b-free')!;
    const result = component.calculateCancellationFee(booking);

    expect(result.fee).toBe(0);
    expect(result.severity).toBe('green');
    expect(result.label).toContain('Free cancellation');
  });

  it('returns 50 % of first night for bookings 3–14 days away', () => {
    const booking = mockBookings.find(b => b.id === 'b-half')!;
    const result = component.calculateCancellationFee(booking);

    expect(result.fee).toBe(60);        // 50 % of £120
    expect(result.severity).toBe('amber');
    expect(result.label).toContain('50%');
  });

  it('returns 100 % of first night for bookings less than 72 hours away', () => {
    const booking = mockBookings.find(b => b.id === 'b-full')!;
    const result = component.calculateCancellationFee(booking);

    expect(result.fee).toBe(120);       // 100 % of £120
    expect(result.severity).toBe('red');
    expect(result.label).toContain('100%');
  });
});
