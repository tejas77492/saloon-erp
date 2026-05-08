// ─── Service ─────────────────────────────────────────────────────────────────
export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  bufferTime: number;
  category: 'hair' | 'beard' | 'skin' | 'nails' | 'other';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Booking ─────────────────────────────────────────────────────────────────
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  _id: string;
  user?: { _id: string; name: string; email: string };
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  services: Service[];
  date: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalPrice: number;
  status: BookingStatus;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Slot ────────────────────────────────────────────────────────────────────
export type SlotStatus = 'available' | 'booked' | 'blocked' | 'closed';

export interface Slot {
  time: string;
  status: SlotStatus;
}

// ─── Working Hours ────────────────────────────────────────────────────────────
export interface WorkingHours {
  _id: string;
  day: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// ─── Blocked Time ─────────────────────────────────────────────────────────────
export interface BlockedTime {
  _id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  isFullDay: boolean;
  recurring: {
    enabled: boolean;
    days: number[];
  };
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  _id: string;
  user: string;
  type: 'booking_cancelled' | 'booking_confirmed' | 'shop_closed' | 'time_blocked' | 'general';
  title: string;
  message: string;
  booking?: Booking;
  isRead: boolean;
  createdAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  todayCount: number;
  todayRevenue: number;
  totalRevenue: number;
  totalBookings: number;
  topServices: { name: string; count: number }[];
  upcoming: Booking[];
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  unreadCount?: number;
}
