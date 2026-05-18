// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { TestBed, ComponentFixture } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  provideRouter,
  convertToParamMap,
} from '@angular/router';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RoomDetailComponent } from './room-detail';
import { RoomService } from '../../../core/services/room.service';
import { BookingService } from '../../../core/services/booking.service';
import { AncillaryServiceService } from '../../../core/services/ancillary.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Room, Booking } from '../../../core/models';

const mockRoom: Room = {
  id: '42',
  hotelId: 'hotel-1',
  roomNumber: '101',
  type: 'Standard Double',
  capacity: 2,
  priceOffPeak: 120,
  pricePeak: 180,
  status: 'Available',
  description: 'A comfortable standard room.',
  imageUrls: [],
  floor: 1,
  createdAt: '2024-01-01T00:00:00',
};

const mockBooking: Partial<Booking> = {
  id: 'booking-1',
  hotelId: 'hotel-1',
  referenceNumber: 'HMS-2025-00001',
  checkInDate: '2025-09-01T00:00:00',
  checkOutDate: '2025-09-05T00:00:00',
  totalPrice: 480,
  status: 'Confirmed',
};

describe('RoomDetailComponent — booking form', () => {
  let fixture: ComponentFixture<RoomDetailComponent>;
  let component: RoomDetailComponent;
  let mockRoomService: { getById: ReturnType<typeof vi.fn> };
  let mockBookingService: { createBooking: ReturnType<typeof vi.fn> };
  let mockAncillaryService: { getAncillaryServices: ReturnType<typeof vi.fn> };
  let mockToastService: {
    warning: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // Prevent GSAP from running in JSDOM by reporting prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });

    mockRoomService = { getById: vi.fn().mockReturnValue(of(mockRoom)) };
    mockBookingService = {
      createBooking: vi.fn().mockReturnValue(of(mockBooking)),
    };
    mockAncillaryService = {
      getAncillaryServices: vi.fn().mockReturnValue(of([])),
    };
    mockToastService = {
      warning: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RoomDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RoomService, useValue: mockRoomService },
        { provide: BookingService, useValue: mockBookingService },
        { provide: AncillaryServiceService, useValue: mockAncillaryService },
        { provide: ToastService, useValue: mockToastService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '42' })),
            queryParamMap: of(convertToParamMap({ checkIn: '', checkOut: '' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomDetailComponent);
    component = fixture.componentInstance;

    // Prevent unhandled router rejection when confirmBooking() navigates
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  });

  // ── Validation: checkout before checkin ─────────────────────────────────

  it('shows a validation error when check-out date is before check-in date', () => {
    component.setCheckIn('2025-08-20');
    component.setCheckOut('2025-08-15');

    expect(component.nights()).toBe(0);
    expect(component.datesValid()).toBe(false);

    component.confirmBooking();

    expect(mockToastService.warning).toHaveBeenCalledWith(
      'Please select valid check-in and check-out dates.'
    );
    expect(mockBookingService.createBooking).not.toHaveBeenCalled();
  });

  // ── Validation: check-in in the past (same-day checkout → zero nights) ──

  it('shows a validation error when check-in and check-out are on the same past date (zero nights)', () => {
    component.setCheckIn('2020-03-01');
    component.setCheckOut('2020-03-01');

    expect(component.nights()).toBe(0);
    expect(component.datesValid()).toBe(false);

    component.confirmBooking();

    expect(mockToastService.warning).toHaveBeenCalled();
    expect(mockBookingService.createBooking).not.toHaveBeenCalled();
  });

  // ── Valid dates allow form submission ───────────────────────────────────

  it('allows form submission when dates are valid', () => {
    component.setCheckIn('2025-09-01');
    component.setCheckOut('2025-09-05');

    expect(component.nights()).toBe(4);
    expect(component.datesValid()).toBe(true);

    component.confirmBooking();

    expect(mockBookingService.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        hotelId: 'hotel-1',
        checkInDate: '2025-09-01T00:00:00',
        checkOutDate: '2025-09-05T00:00:00',
        roomIds: [42],
      })
    );
  });

  // ── Price summary updates when dates change ─────────────────────────────

  it('displays off-peak price in January and peak price in July', () => {
    // Off-peak: January (not in [6,7,8,12])
    component.setCheckIn('2025-01-10');
    component.setCheckOut('2025-01-13');

    expect(component.isPeakSeason()).toBe(false);
    expect(component.displayPrice()).toBe(120);   // priceOffPeak
    expect(component.nights()).toBe(3);
    expect(component.roomSubtotal()).toBe(360);    // 120 × 3
    expect(component.grandTotal()).toBe(360);

    // Peak: July (month 7)
    component.setCheckIn('2025-07-10');
    component.setCheckOut('2025-07-13');

    expect(component.isPeakSeason()).toBe(true);
    expect(component.displayPrice()).toBe(180);   // pricePeak
    expect(component.nights()).toBe(3);
    expect(component.roomSubtotal()).toBe(540);    // 180 × 3
    expect(component.grandTotal()).toBe(540);
  });
});
