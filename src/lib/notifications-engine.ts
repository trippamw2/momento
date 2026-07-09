"use client";

// ─── Types ───

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
  | "payment_success"
  | "gift_card_purchased"
  | "points_earned"
  | "tier_upgrade"
  | "gift_received"
  | "gift_redeemed"
  | "review_request"
  | "new_experience"
  | "flash_sale"
  | "achievement_unlocked";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;         // relative like "2h ago"
  timestamp: number;    // epoch ms for sorting
  read: boolean;
  experienceId?: string;
  actionLabel?: string;
  actionHref?: string;
}

// ─── Helpers ───

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("experio-auth-token");
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

/** Map a DB notification row to the AppNotification shape used by UI */
function mapNotification(row: Record<string, unknown>): AppNotification {
  const data = (row.data || {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    type: String(row.type) as NotificationType,
    title: String(row.title),
    description: String(row.body || row.description || ""),
    time: relativeTime(String(row.created_at)),
    timestamp: new Date(String(row.created_at)).getTime(),
    read: Boolean(row.is_read ?? row.read),
    experienceId: data.experience_id ? String(data.experience_id) : undefined,
    actionLabel: deriveActionLabel(String(row.type)),
    actionHref: deriveActionHref(String(row.type), data),
  };
}

function deriveActionLabel(type: string): string | undefined {
  switch (type) {
    case "booking_confirmed":
    case "booking_cancelled":
    case "payment_success":
      return "View Booking";
    case "gift_received":
    case "gift_card_purchased":
      return "View Gift";
    case "points_earned":
    case "tier_upgrade":
    case "achievement_unlocked":
      return "View Rewards";
    case "review_request":
      return "Write Review";
    case "new_experience":
    case "flash_sale":
      return "Browse";
    default:
      return undefined;
  }
}

function deriveActionHref(type: string, data: Record<string, unknown>): string | undefined {
  switch (type) {
    case "booking_confirmed":
    case "booking_cancelled":
    case "payment_success":
      return "/bookings";
    case "gift_received":
    case "gift_card_purchased":
      return "/gift/redeem";
    case "points_earned":
    case "tier_upgrade":
    case "achievement_unlocked":
      return "/loyalty";
    case "review_request":
      return data.experience_id ? `/experiences/${data.experience_id}` : "/experiences";
    case "new_experience":
    case "flash_sale":
      return "/experiences";
    default:
      return undefined;
  }
}

// ─── API Functions ───

export async function getNotifications(): Promise<AppNotification[]> {
  const token = getToken();
  if (!token) return [];

  try {
    const res = await fetch("/api/notifications?limit=50", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.notifications || []).map(mapNotification);
  } catch {
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  const token = getToken();
  if (!token) return 0;

  try {
    const res = await fetch("/api/notifications?limit=50&unread=true", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.unread || 0;
  } catch {
    return 0;
  }
}

export async function markAsRead(notificationId: string): Promise<void> {
  const token = getToken();
  if (!token) return;

  try {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: [notificationId] }),
    });
  } catch { /* ignore */ }
}

export async function markAllAsRead(): Promise<void> {
  const token = getToken();
  if (!token) return;

  try {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ markAll: true }),
    });
  } catch { /* ignore */ }
}

// ─── Preset creators (still synchronous — used for optimistic UI) ───

export function createBookingConfirmedNotification(
  experienceTitle: string,
  bookingId: string,
): AppNotification {
  return {
    id: `notif-${Date.now()}`,
    type: "booking_confirmed",
    title: "Booking Confirmed!",
    description: `Your ${experienceTitle} booking has been confirmed. Get ready for an unforgettable time!`,
    time: "Just now",
    timestamp: Date.now(),
    read: false,
    actionLabel: "View Booking",
    actionHref: "/bookings",
  };
}

export function createPointsEarnedNotification(points: number): AppNotification {
  return {
    id: `notif-${Date.now()}`,
    type: "points_earned",
    title: `You earned ${points} points!`,
    description: `Keep booking to unlock more rewards and reach the next tier.`,
    time: "Just now",
    timestamp: Date.now(),
    read: false,
    actionLabel: "View Rewards",
    actionHref: "/loyalty",
  };
}

export function createReviewRequestNotification(experienceId: string, experienceTitle: string): AppNotification {
  return {
    id: `notif-${Date.now()}`,
    type: "review_request",
    title: "How was your experience?",
    description: `You recently visited ${experienceTitle}. Share your thoughts!`,
    time: "Just now",
    timestamp: Date.now(),
    read: false,
    experienceId,
    actionLabel: "Write Review",
    actionHref: `/experiences/${experienceId}`,
  };
}
