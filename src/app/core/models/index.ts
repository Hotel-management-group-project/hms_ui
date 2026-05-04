// Student ID: WP1234567
// Student Name: Mohamed Iyaadh Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

export type UserRole = 'Guest' | 'FrontDesk' | 'Manager' | 'Admin';
export type RoomType = 'Standard Double' | 'Deluxe King' | 'Family Suite' | 'Penthouse';
export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'OutOfService';
export type BookingStatus = 'Pending' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Completed' | 'Refunded';

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

export interface Hotel {
  id: string;
  name: string;
  location: string;
  address: string;
  description: string;
  imageUrl: string;
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
  floor: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  guestId: string;
  hotelId: string;
  referenceNumber: string; // HMS-YYYY-XXXXX
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: BookingStatus;
  cancellationFee: number;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
  rooms?: Room[];
  ancillaryServices?: BookingAncillaryService[];
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

export interface BookingAncillaryService {
  id: string;
  bookingId: string;
  serviceId: string;
  quantity: number;
  totalPrice: number;
  service?: AncillaryService;
}

export interface Waitlist {
  id: string;
  guestId: string;
  hotelId: string;
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  createdAt: string;
}

export interface RoomSearchQuery {
  hotelId?: string;
  type?: string;
  checkIn?: string;
  checkOut?: string;
  capacity?: number;
}
