"use client";

// â”€â”€â”€ Types â”€â”€â”€

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remaining: number;
}

export interface BookingRequest {
  experienceId: string;
  date: string;
  time?: string;
  guests: number;
  userId: string;
  specialRequests?: string;
  contactPhone?: string;
  contactEmail?: string;
}

// â”€â”€â”€ Mock data: capacity per experience â”€â”€â”€

const EXPERIENCE_CAPACITY: Record<string, number> = {
  "sunset-cruise": 12,
  "pool-lunch": 20,
  "spa-day": 6,
  "date-night": 8,
  "rooftop-dining": 14,
  "glamping-weekend": 10,
  "brunch-experience": 16,
  "private-beach-dinner": 8,
  "wellness-retreat": 10,
};

/** Default capacity for unknown experiences */
const DEFAULT_CAPACITY = 10;

/** Mock: past bookings (reduces capacity for a given date) */
function getMockBookedCount(experienceId: string, date: string): number {
  // Deterministic pseudo-random based on id + date hash
  const hash = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  };
  const key = `${experienceId}-${date}`;
  return hash(key) % 5; // 0-4 pre-booked slots
}

// â”€â”€â”€ Time slot generation â”€â”€â”€

const TIME_SLOTS: { start: string; end: string }[] = [
  { start: "09:00", end: "11:00" },
  { start: "11:00", end: "13:00" },
  { start: "13:00", end: "15:00" },
  { start: "15:00", end: "17:00" },
  { start: "17:00", end: "19:00" },
  { start: "19:00", end: "21:00" },
];

export function getAvailability(experienceId: string, date: string): TimeSlot[] {
  const capacity = EXPERIENCE_CAPACITY[experienceId] ?? DEFAULT_CAPACITY;
  const booked = getMockBookedCount(experienceId, date);

  return TIME_SLOTS.map((slot) => {
    const slotBooked = Math.min(capacity, Math.round((booked / TIME_SLOTS.length) + (Math.random() > 0.6 ? 1 : 0)));
    const remaining = Math.max(0, capacity - slotBooked);
    return {
      date,
      startTime: slot.start,
      endTime: slot.end,
      capacity,
      remaining,
    };
  });
}

export function checkAvailability(experienceId: string, date: string, guests: number): boolean {
  const slots = getAvailability(experienceId, date);
  return slots.some((s) => s.remaining >= guests);
}

// â”€â”€â”€ Mock booking storage â”€â”€â”€

const STORAGE_KEY = "momento-booking-engine";

interface StoredBooking {
  id: string;
  experienceId: string;
  date: string;
  time?: string;
  guests: number;
  userId: string;
  specialRequests?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
  totalPrice: number;
}

function loadStored(): StoredBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStored(bookings: StoredBooking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch { /* noop */ }
}

function generateId(): string {
  return `BK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function createBooking(request: BookingRequest, totalPrice: number): StoredBooking {
  const booking: StoredBooking = {
    id: generateId(),
    experienceId: request.experienceId,
    date: request.date,
    time: request.time,
    guests: request.guests,
    userId: request.userId,
    specialRequests: request.specialRequests,
    contactPhone: request.contactPhone,
    contactEmail: request.contactEmail,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    totalPrice,
  };

  const all = loadStored();
  all.push(booking);
  saveStored(all);
  return booking;
}

export function cancelBooking(bookingId: string): boolean {
  const all = loadStored();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx === -1) return false;
  all[idx].status = "cancelled";
  saveStored(all);
  return true;
}

export function getBookingCountdown(dateStr: string): { days: number; hours: number; minutes: number; expired: boolean } {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes, expired: false };
}

export function getUpcomingBookings(): StoredBooking[] {
  return loadStored().filter((b) => b.status === "confirmed");
}

export function getAllBookings(): StoredBooking[] {
  return loadStored();
}
