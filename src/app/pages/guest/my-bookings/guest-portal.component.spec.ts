import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MyBookingsComponent } from './my-bookings';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../shared/components/toast/toast';
import { Booking } from '../../../core/models';

function futureDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

const mockBookings: Booking[] = [
  {
    id: '1',
    guestId: 'guest-1',
    hotelId: 'hotel-1',
    referenceNumber: 'HMS-2026-00001',
    checkInDate: futureDateISO(10),
    checkOutDate: futureDateISO(12),
    totalPrice: 240,
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    guestId: 'guest-1',
    hotelId: 'hotel-1',
    referenceNumber: 'HMS-2026-00002',
    checkInDate: futureDateISO(20),
    checkOutDate: futureDateISO(22),
    totalPrice: 360,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('MyBookingsComponent (guest-portal)', () => {
  let component: MyBookingsComponent;
  let fixture: ComponentFixture<MyBookingsComponent>;
  let mockBookingService: { getMyBookings: ReturnType<typeof vi.fn> };
  let mockToast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockBookingService = { getMyBookings: vi.fn() };
    mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MyBookingsComponent],
      providers: [
        provideRouter([]),
        { provide: BookingService, useValue: mockBookingService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyBookingsComponent);
    component = fixture.componentInstance;
  });

  it('GuestPortal_LoadsUserBookings', async () => {
    // Arrange — service returns 2 upcoming bookings
    mockBookingService.getMyBookings.mockReturnValue(of(mockBookings));

    // Act — detectChanges triggers ngOnInit → fetchBookings
    fixture.detectChanges();
    await fixture.whenStable();

    // Assert — component holds both bookings and shows them in the upcoming tab
    expect(component.bookings()).toHaveLength(2);
    expect(component.upcomingBookings()).toHaveLength(2);
  });

  it('GuestPortal_ShowsEmptyState_WhenNoBookings', async () => {
    // Arrange — service returns an empty list
    mockBookingService.getMyBookings.mockReturnValue(of([]));

    // Act
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges(); // second pass to flush signal-driven template updates

    // Assert — signals are empty
    expect(component.bookings()).toHaveLength(0);
    expect(component.upcomingBookings()).toHaveLength(0);

    // Assert — empty state message is rendered in the DOM
    expect(fixture.nativeElement.textContent).toContain('No upcoming stays found.');
  });
});
