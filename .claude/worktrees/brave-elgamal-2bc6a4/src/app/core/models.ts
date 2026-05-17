// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

export type UserRole = 'Guest' | 'FrontDesk' | 'Manager' | 'Admin';

export type RoomType = 'Standard Double' | 'Deluxe King' | 'Family Suite' | 'Penthouse';
export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'OutOfService';
export type BookingStatus = 'Pending' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Completed' | 'Refunded';

export interface Hotel {
  id: string;
  name: string;
  location: string;
  address: string;
  description: string;
  imageUrl?: string | null;
  isActive: boolean;
  roomCount?: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  priceOffPeak: number;
  pricePeak: number;
  status: RoomStatus;
  description: string;
  imageUrls: string[];
  floor: number;
  createdAt: string;
}

export interface BookingRoomDto {
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  pricePerNight: number;
}

export interface BookingAncillaryService {
  id: string;
  serviceId: string;
  service?: { name: string; price: number };
  quantity: number;
  totalPrice: number;
}

export interface Booking {
  id: string;
  guestId: string;
  hotelId: string;
  referenceNumber: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: BookingStatus;
  cancellationFee?: number;
  qrCodeUrl?: string;
  rooms?: BookingRoomDto[];
  ancillaryServices?: BookingAncillaryService[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  transactionReference: string;
  processedAt: string;
}

export interface AncillaryService {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface WaitlistEntry {
  id: string;
  guestId: string;
  hotelId: string;
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  createdAt: string;
}

export type Waitlist = WaitlistEntry;

export interface RoomSearchQuery {
  hotelId?: string;
  type?: RoomType;
  checkIn?: string;
  checkOut?: string;
  capacity?: number;
}
