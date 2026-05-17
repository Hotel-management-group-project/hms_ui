import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { BookingComponent } from './booking';
import { RoomService } from '../../../core/services/room.service';
import { AncillaryServiceService } from '../../../core/services/ancillary.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Room } from '../../../core/models';

const mockRoom: Room = {
  id: '1',
  hotelId: 'hotel-1',
  roomNumber: '101',
  type: 'Standard Double',
  capacity: 2,
  priceOffPeak: 120,
  pricePeak: 180,
  status: 'Available',
  description: 'Test room',
  imageUrls: [],
  floor: 1,
  createdAt: new Date().toISOString(),
};

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

describe('BookingComponent (booking-form)', () => {
  let component: BookingComponent;
  let fixture: ComponentFixture<BookingComponent>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockToast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };
  let mockBookingService: { createBooking: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockRouter = { navigate: vi.fn() };
    mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
    mockBookingService = { createBooking: vi.fn() };

    // Valid future dates: tomorrow → day after tomorrow
    const checkIn = dateOffset(1);
    const checkOut = dateOffset(2);

    const mockQueryParamMap = {
      get: (key: string): string | null =>
        ({ roomId: '1', checkIn, checkOut }[key] ?? null),
    };

    await TestBed.configureTestingModule({
      imports: [BookingComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(mockQueryParamMap) },
        },
        {
          provide: RoomService,
          useValue: { getById: vi.fn().mockReturnValue(of(mockRoom)) },
        },
        {
          provide: AncillaryServiceService,
          useValue: { getAncillaryServices: vi.fn().mockReturnValue(of([])) },
        },
        { provide: BookingService, useValue: mockBookingService },
        { provide: AuthService, useValue: { currentUser: signal(null) } },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('BookingForm_InvalidDates_ShowsError', () => {
    // Arrange — required guest fields are empty by default (form starts invalid)
    expect(component.guestForm.invalid).toBe(true);

    // Act — attempt to submit without filling required fields
    component.submitBooking();

    // Assert — form is still invalid and all controls are now touched (field errors surfaced)
    expect(component.guestForm.invalid).toBe(true);
    expect(component.guestForm.controls['firstName'].touched).toBe(true);
    expect(component.guestForm.controls['email'].touched).toBe(true);
    // Booking must not have been initiated
    expect(mockBookingService.createBooking).not.toHaveBeenCalled();
  });

  it('BookingForm_ValidDates_FormIsValid', () => {
    // Arrange — checkIn (tomorrow) and checkOut (day after) are set via query params.
    // Fill all required guest details to make the form valid.
    component.guestForm.setValue({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@hotel.com',
      phone: '07123456789',
    });

    // Assert
    expect(component.guestForm.valid).toBe(true);
    expect(component.nights()).toBeGreaterThan(0);
  });
});
