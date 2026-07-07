"use client";

// ─── Types ───

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
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

// ─── Mock Notification Data ───

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    type: "booking_confirmed",
    title: "Booking Confirmed!",
    description: "Your Sunset Dinner at Kumbali Lake has been confirmed. Get ready for an unforgettable evening!",
    time: "2h ago",
    timestamp: Date.now() - 7200000,
    read: false,
    experienceId: "exp-1",
    actionLabel: "View Booking",
    actionHref: "/bookings",
  },
  {
    id: "notif-2",
    type: "points_earned",
    title: "You earned 150 points!",
    description: "From your booking at Jacaranda Spa. You're just 50 points away from reaching Silver tier!",
    time: "5h ago",
    timestamp: Date.now() - 18000000,
    read: false,
    actionLabel: "View Rewards",
    actionHref: "/loyalty",
  },
  {
    id: "notif-3",
    type: "new_experience",
    title: "New in Lilongwe",
    description: "5 new experiences added near you this week. Check them out before they book up!",
    time: "1d ago",
    timestamp: Date.now() - 86400000,
    read: false,
    actionLabel: "For Explorers",
    actionHref: "/experiences",
  },
  {
    id: "notif-4",
    type: "flash_sale",
    title: "Weekend Flash Sale!",
    description: "Up to 30% off selected experiences this weekend only. Don't miss out!",
    time: "2d ago",
    timestamp: Date.now() - 172800000,
    read: true,
    actionLabel: "Shop Sale",
    actionHref: "/experiences",
  },
  {
    id: "notif-5",
    type: "tier_upgrade",
    title: "You've reached Silver Tier!",
    description: "Congratulations! You've earned Silver status with 5% bonus points on every booking.",
    time: "1w ago",
    timestamp: Date.now() - 604800000,
    read: true,
    actionLabel: "See Benefits",
    actionHref: "/loyalty",
  },
  {
    id: "notif-6",
    type: "review_request",
    title: "How was your experience?",
    description: "You recently visited Sunrise Safari. Share your thoughts and help other explorers!",
    time: "1w ago",
    timestamp: Date.now() - 604800000,
    read: true,
    experienceId: "exp-3",
    actionLabel: "Write Review",
    actionHref: "/experiences/exp-3",
  },
  {
    id: "notif-7",
    type: "gift_received",
    title: "You received a Gift Card!",
    description: "A friend sent you a K25,000 gift card to use on any experience. Happy exploring!",
    time: "2w ago",
    timestamp: Date.now() - 1209600000,
    read: true,
    actionLabel: "View Gift",
    actionHref: "/gift/redeem",
  },
  {
    id: "notif-8",
    type: "achievement_unlocked",
    title: "Achievement: Weekend Warrior",
    description: "You booked 3 weekend experiences! You're making the most of your weekends.",
    time: "2w ago",
    timestamp: Date.now() - 1209600000,
    read: true,
    actionLabel: "View Achievements",
    actionHref: "/loyalty",
  },
];

// ─── Storage ───

const STORAGE_KEY = "momento-notifications";

function loadNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return MOCK_NOTIFICATIONS;
}

function saveNotifications(notifications: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch { /* ignore */ }
}

// ─── API ───

export function getNotifications(): AppNotification[] {
  return loadNotifications().sort((a, b) => b.timestamp - a.timestamp);
}

export function getUnreadCount(): number {
  return loadNotifications().filter((n) => !n.read).length;
}

export function markAsRead(notificationId: string): void {
  const notifications = loadNotifications();
  const idx = notifications.findIndex((n) => n.id === notificationId);
  if (idx !== -1) {
    notifications[idx].read = true;
    saveNotifications(notifications);
  }
}

export function markAllAsRead(): void {
  const notifications = loadNotifications();
  notifications.forEach((n) => { n.read = true; });
  saveNotifications(notifications);
}

export function addNotification(notification: AppNotification): void {
  const notifications = loadNotifications();
  notifications.unshift(notification);
  saveNotifications(notifications.slice(0, 50)); // keep max 50
}

// ─── Presets for hooks to call ───

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
