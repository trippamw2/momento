"use client";

// ─── Configuration ───

export interface LoyaltyConfig {
  pointsPerBooking: number;   // points per MK 1,000 spent
  pointsPerReview: number;
  pointsPerReferral: number;
  pointsPerGift: number;      // points per MK 1,000 gifted
  pointsPerShare: number;
  signupBonus: number;
  birthdayBonus: number;
}

export const DEFAULT_CONFIG: LoyaltyConfig = {
  pointsPerBooking: 10,      // 10 pts per MK 1,000
  pointsPerReview: 50,
  pointsPerReferral: 200,
  pointsPerGift: 5,          // 5 pts per MK 1,000 gifted
  pointsPerShare: 20,
  signupBonus: 100,
  birthdayBonus: 500,
};

// ─── Tiers ───

export interface TierConfig {
  name: TierName;
  minPoints: number;
  color: string;       // gradient-start
  colorEnd: string;    // gradient-end
  icon: string;
  multiplier: number;  // points multiplier
  benefits: string[];
}

export type TierName = "bronze" | "silver" | "gold" | "platinum" | "vip";

export const TIERS: TierConfig[] = [
  {
    name: "bronze",
    minPoints: 0,
    color: "#8B6914",
    colorEnd: "#C49B2A",
    icon: "🥉",
    multiplier: 1,
    benefits: ["Welcome bonus", "Birthday reward"],
  },
  {
    name: "silver",
    minPoints: 500,
    color: "#9CA3AF",
    colorEnd: "#D1D5DB",
    icon: "🥈",
    multiplier: 1.2,
    benefits: ["Welcome bonus", "Birthday reward", "5% discount on bookings"],
  },
  {
    name: "gold",
    minPoints: 2000,
    color: "#F59E0B",
    colorEnd: "#FCD34D",
    icon: "🥇",
    multiplier: 1.5,
    benefits: ["Welcome bonus", "Birthday reward x2", "5% discount", "Priority booking", "Exclusive experiences"],
  },
  {
    name: "platinum",
    minPoints: 5000,
    color: "#06B6D4",
    colorEnd: "#67E8F9",
    icon: "💎",
    multiplier: 2,
    benefits: ["Welcome bonus", "Birthday reward x3", "10% discount", "Priority access", "Exclusive experiences", "Dedicated concierge"],
  },
  {
    name: "vip",
    minPoints: 20000,
    color: "#A855F7",
    colorEnd: "#D8B4FE",
    icon: "👑",
    multiplier: 3,
    benefits: ["Welcome bonus", "Birthday reward x5", "15% discount", "VIP-only experiences", "Personal concierge", "Event invites", "Early access"],
  },
];

export const TIER_MAP: Record<TierName, TierConfig> = Object.fromEntries(
  TIERS.map((t) => [t.name, t])
) as Record<TierName, TierConfig>;

// ─── Achievements ───

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number;    // 0-100
  requirement: number;
  current: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: UserStats) => { unlocked: boolean; progress: number; current: number; requirement: number };
}

export interface UserStats {
  totalBookings: number;
  totalSpent: number;        // in MWK
  totalReviews: number;
  totalReferrals: number;
  totalGifts: number;
  totalGifted: number;       // amount gifted in MWK
  totalShares: number;
  daysSinceSignup: number;
  citiesVisited: string[];
  categories: string[];
  consecutiveBookings: number;
  birthdayBooked: boolean;
}

export function checkAchievements(stats: UserStats): AchievementDef[] {
  return ACHIEVEMENT_DEFS.map((def) => {
    const result = def.check(stats);
    return { ...def, ...result };
  }).filter((a) => a.unlocked || a.current > 0);
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first_booking",
    name: "First Adventure",
    description: "Book your first experience",
    icon: "🎉",
    check: (s) => ({ unlocked: s.totalBookings >= 1, progress: Math.min(100, (s.totalBookings / 1) * 100), current: s.totalBookings, requirement: 1 }),
  },
  {
    id: "five_bookings",
    name: "Explorer",
    description: "Book 5 experiences",
    icon: "🧭",
    check: (s) => ({ unlocked: s.totalBookings >= 5, progress: Math.min(100, (s.totalBookings / 5) * 100), current: s.totalBookings, requirement: 5 }),
  },
  {
    id: "ten_bookings",
    name: "Adventurer",
    description: "Book 10 experiences",
    icon: "🏆",
    check: (s) => ({ unlocked: s.totalBookings >= 10, progress: Math.min(100, (s.totalBookings / 10) * 100), current: s.totalBookings, requirement: 10 }),
  },
  {
    id: "big_spender",
    name: "Big Spender",
    description: "Spend MK 500,000 total on experiences",
    icon: "💰",
    check: (s) => ({ unlocked: s.totalSpent >= 500000, progress: Math.min(100, (s.totalSpent / 500000) * 100), current: s.totalSpent, requirement: 500000 }),
  },
  {
    id: "reviewer",
    name: "Critic",
    description: "Leave 3 reviews",
    icon: "✍️",
    check: (s) => ({ unlocked: s.totalReviews >= 3, progress: Math.min(100, (s.totalReviews / 3) * 100), current: s.totalReviews, requirement: 3 }),
  },
  {
    id: "globetrotter",
    name: "Globetrotter",
    description: "Book experiences in 3 different cities",
    icon: "🌍",
    check: (s) => ({ unlocked: s.citiesVisited.length >= 3, progress: Math.min(100, (s.citiesVisited.length / 3) * 100), current: s.citiesVisited.length, requirement: 3 }),
  },
  {
    id: "variety",
    name: "Variety Seeker",
    description: "Try 4 different experience categories",
    icon: "🎯",
    check: (s) => ({ unlocked: s.categories.length >= 4, progress: Math.min(100, (s.categories.length / 4) * 100), current: s.categories.length, requirement: 4 }),
  },
  {
    id: "streak_3",
    name: "Weekend Warrior",
    description: "Book 3 consecutive weekends",
    icon: "🔥",
    check: (s) => ({ unlocked: s.consecutiveBookings >= 3, progress: Math.min(100, (s.consecutiveBookings / 3) * 100), current: s.consecutiveBookings, requirement: 3 }),
  },
  {
    id: "gifter",
    name: "Generous Soul",
    description: "Send 5 gift cards",
    icon: "🎁",
    check: (s) => ({ unlocked: s.totalGifts >= 5, progress: Math.min(100, (s.totalGifts / 5) * 100), current: s.totalGifts, requirement: 5 }),
  },
  {
    id: "referrer",
    name: "Influencer",
    description: "Refer 3 friends",
    icon: "🤝",
    check: (s) => ({ unlocked: s.totalReferrals >= 3, progress: Math.min(100, (s.totalReferrals / 3) * 100), current: s.totalReferrals, requirement: 3 }),
  },
  {
    id: "birthday",
    name: "Birthday Booker",
    description: "Book an experience on your birthday",
    icon: "🎂",
    check: (s) => ({ unlocked: s.birthdayBooked, progress: s.birthdayBooked ? 100 : 0, current: s.birthdayBooked ? 1 : 0, requirement: 1 }),
  },
  {
    id: "vip_tier",
    name: "VIP Status",
    description: "Reach VIP tier",
    icon: "👑",
    check: (s) => ({ unlocked: false, progress: 0, current: 0, requirement: 20000 }),
  },
];

// ─── User Loyalty State ───

export interface UserLoyalty {
  userId: string;
  points: number;
  lifetimePoints: number;
  tier: TierName;
  nextTier: TierName | null;
  tierProgress: number; // 0-100
  pointsToNextTier: number;
  achievements: AchievementDef[];
  unlockedAchievementCount: number;
  totalAchievementCount: number;
}

// ─── Engine Functions ───

export function calculateTier(lifetimePoints: number): { tier: TierName; nextTier: TierName | null; progress: number; pointsToNext: number } {
  const sorted = [...TIERS].sort((a, b) => b.minPoints - a.minPoints);
  for (const t of sorted) {
    if (lifetimePoints >= t.minPoints) {
      const next = TIERS.find((nt) => nt.minPoints > t.minPoints);
      if (!next) return { tier: t.name, nextTier: null, progress: 100, pointsToNext: 0 };
      const progress = Math.min(100, ((lifetimePoints - t.minPoints) / (next.minPoints - t.minPoints)) * 100);
      return { tier: t.name, nextTier: next.name, progress, pointsToNext: next.minPoints - lifetimePoints };
    }
  }
  return { tier: "bronze", nextTier: "silver", progress: 0, pointsToNext: 500 };
}

export function calculatePoints(amount: number, config: LoyaltyConfig = DEFAULT_CONFIG): number {
  // pointsPerBooking per MK 1,000
  return Math.floor(amount / 1000) * config.pointsPerBooking;
}

export function buildUserLoyalty(
  userId: string,
  points: number,
  lifetimePoints: number,
  stats: UserStats | null,
  achievements?: AchievementDef[],
): UserLoyalty {
  const tierInfo = calculateTier(lifetimePoints);
  const allAchievements = achievements || (stats ? checkAchievements(stats) : []);
  const unlockedCount = allAchievements.filter((a) => a.check(stats || { totalBookings: 0, totalSpent: 0, totalReviews: 0, totalReferrals: 0, totalGifts: 0, totalGifted: 0, totalShares: 0, daysSinceSignup: 0, citiesVisited: [], categories: [], consecutiveBookings: 0, birthdayBooked: false }).unlocked).length;

  return {
    userId,
    points,
    lifetimePoints,
    tier: tierInfo.tier,
    nextTier: tierInfo.nextTier,
    tierProgress: tierInfo.progress,
    pointsToNextTier: tierInfo.pointsToNext,
    achievements: allAchievements,
    unlockedAchievementCount: unlockedCount,
    totalAchievementCount: ACHIEVEMENT_DEFS.length,
  };
}

// ─── LocalStorage persistence (MVP) ───

const STORAGE_KEY = "experio-loyalty";

export function getStoredLoyalty(): { points: number; lifetimePoints: number; tier: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeLoyalty(data: { points: number; lifetimePoints: number; tier: string }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* noop */ }
}

export function addPointsLocally(amount: number, reason: string): { points: number; lifetimePoints: number; tier: string } {
  const current = getStoredLoyalty() || { points: 0, lifetimePoints: 0, tier: "bronze" };
  const updated = {
    points: current.points + amount,
    lifetimePoints: current.lifetimePoints + amount,
    tier: calculateTier(current.lifetimePoints + amount).tier,
  };
  storeLoyalty(updated);
  return updated;
}

// ─── Points earning helpers ───

export function getTierConfig(tier: TierName): TierConfig {
  return TIER_MAP[tier] || TIER_MAP.bronze;
}

export function canUserEarnPoints(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("experio-auth-token");
}

export function formatPoints(amount: number): string {
  return amount.toLocaleString();
}
