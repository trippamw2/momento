"use client";

import { Experience } from "./types";

const STORAGE_KEYS = {
  VIEWED: "experio-recs-viewed",
  BOOKED: "experio-recs-booked",
  SAVED: "experio-recs-saved",
  CATEGORY_SCORES: "experio-recs-category-scores",
  LAST_PROMPT: "experio-recs-last-prompt",
} as const;

// ─── Tracking ───

export function trackView(experienceId: string) {
  if (typeof window === "undefined") return;
  try {
    const viewed = getViewed();
    const updated = [{ id: experienceId, timestamp: Date.now() }, ...viewed.filter((v) => v.id !== experienceId)].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.VIEWED, JSON.stringify(updated));
    updateCategoryScore(experienceId);
  } catch {}
}

export function trackBooked(experienceId: string) {
  if (typeof window === "undefined") return;
  try {
    const booked = getBooked();
    const updated = [{ id: experienceId, timestamp: Date.now() }, ...booked.filter((v) => v.id !== experienceId)].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.BOOKED, JSON.stringify(updated));
  } catch {}
}

export function trackSaved(experienceId: string, saved: boolean) {
  if (typeof window === "undefined") return;
  try {
    const savedIds = getSaved();
    const updated = saved
      ? [{ id: experienceId, timestamp: Date.now() }, ...savedIds.filter((v) => v.id !== experienceId)].slice(0, 20)
      : savedIds.filter((v) => v.id !== experienceId);
    localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(updated));
  } catch {}
}

// ─── Reading stored data ───

interface TimestampedId {
  id: string;
  timestamp: number;
}

function getViewed(): TimestampedId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VIEWED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getBooked(): TimestampedId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getSaved(): TimestampedId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getCategoryScores(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORY_SCORES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function updateCategoryScore(experienceId: string) {
  // We don't have access to the experience data here by ID,
  // so we store experience IDs for scoring during the recommendation pass.
  // The actual scoring happens in getPersonalizedRecommendations.
}

// ─── Scoring ───

function getTimeOfDayBonus(): Record<string, number> {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return { Celebrate: 3, Chill: 1 };
  if (hour >= 12 && hour < 17) return { Chill: 2, Celebrate: 1 };
  if (hour >= 17 && hour < 22) return { Date: 3, Escape: 2, Celebrate: 1 };
  return { Escape: 2, Date: 1 };
}

function getDayOfWeekBonus(): Record<string, number> {
  const day = new Date().getDay();
  if (day === 5 || day === 6) return { Date: 2, Escape: 2, Chill: 1 };
  if (day === 0) return { Celebrate: 3, Chill: 2 };
  return { Chill: 1 };
}

// ─── Public API ───

export function getPersonalizedRecommendations(
  experiences: Experience[],
  location?: { lat: number; lng: number }
): Experience[] {
  if (experiences.length === 0) return [];

  const viewed = getViewed();
  const booked = getBooked();
  const saved = getSaved();

  const viewedIds = new Set(viewed.map((v) => v.id));
  const bookedIds = new Set(booked.map((v) => v.id));
  const savedIds = new Set(saved.map((v) => v.id));
  const interactedIds = new Set([...viewedIds, ...bookedIds, ...savedIds]);

  // Count category preferences from interactions
  const categoryCounts: Record<string, number> = {};
  for (const exp of experiences) {
    if (interactedIds.has(exp.id)) {
      categoryCounts[exp.category] = (categoryCounts[exp.category] || 0) + 1;
    }
  }

  const timeBonus = getTimeOfDayBonus();
  const dayBonus = getDayOfWeekBonus();

  // Score each experience
  const scored = experiences.map((exp) => {
    let score = 0;

    // Recency bonus: recently viewed/books/saved get +2 if within 3 days
    const viewedEntry = viewed.find((v) => v.id === exp.id);
    if (viewedEntry) {
      score += 1;
      if (Date.now() - viewedEntry.timestamp < 3 * 24 * 60 * 60 * 1000) score += 1;
    }

    // Booked/saved boost
    if (bookedIds.has(exp.id)) score += 3;
    if (savedIds.has(exp.id)) score += 2;

    // Category preference bonus
    const catScore = categoryCounts[exp.category] || 0;
    score += catScore * 0.5;

    // Time of day bonus
    score += timeBonus[exp.category] || 0;

    // Day of week bonus
    score += dayBonus[exp.category] || 0;

    // Rating bonus
    score += (exp.rating - 4) * 2;

    // Variety: prefer categories user hasn't seen much
    // This is already handled by the category preference being additive

    return { exp, score };
  });

  // Sort by score descending, then rating
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.exp.rating - a.exp.rating;
  });

  return scored.map((s) => s.exp).slice(0, 10);
}

export function getRecommendedCategories(experiences: Experience[]): string[] {
  const timeBonus = getTimeOfDayBonus();
  const dayBonus = getDayOfWeekBonus();

  const scores: Record<string, number> = {};
  for (const cat of [...new Set(experiences.map((e) => e.category))]) {
    scores[cat] = (timeBonus[cat] || 0) + (dayBonus[cat] || 0);
  }

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);
}

export function hasUserInteractions(): boolean {
  try {
    return getViewed().length > 0 || getBooked().length > 0 || getSaved().length > 0;
  } catch {
    return false;
  }
}
