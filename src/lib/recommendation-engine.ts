"use client";

import { Experience } from "./types";
import { haversineDistance } from "./geo";
import type { Coordinates } from "./geo";

// â”€â”€â”€ Types â”€â”€â”€

export interface UserInteraction {
  id: string;
  experienceId: string;
  type: "viewed" | "saved" | "liked" | "shared" | "gifted" | "booked";
  timestamp: number;
  weight: number;
}

export interface DiscoveryRail {
  key: string;
  title: string;
  experiences: Experience[];
  subtitle?: string;
  isPersonalized?: boolean;
}

// â”€â”€â”€ Storage â”€â”€â”€

const KEYS = {
  INTERACTIONS: "experio-interactions",
  CATEGORY_AFFINITY: "experio-category-affinity",
} as const;

function loadInteractions(): UserInteraction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.INTERACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveInteractions(interactions: UserInteraction[]) {
  try {
    localStorage.setItem(KEYS.INTERACTIONS, JSON.stringify(interactions.slice(0, 200)));
  } catch (e) { console.warn("Failed to save interactions:", e); }
}

// â”€â”€â”€ Tracking â”€â”€â”€

const WEIGHT_MAP: Record<UserInteraction["type"], number> = {
  viewed: 1,
  liked: 2,
  saved: 3,
  shared: 4,
  gifted: 5,
  booked: 5,
};

export function trackInteraction(experienceId: string, type: UserInteraction["type"]) {
  const interactions = loadInteractions();
  interactions.push({
    id: `${experienceId}-${type}-${Date.now()}`,
    experienceId,
    type,
    timestamp: Date.now(),
    weight: WEIGHT_MAP[type],
  });
  saveInteractions(interactions);
}

export function trackView(experienceId: string) {
  trackInteraction(experienceId, "viewed");
}

export function trackSaved(experienceId: string, saved?: boolean) {
  if (saved !== false) trackInteraction(experienceId, "saved");
}

export function trackBooked(experienceId: string) {
  trackInteraction(experienceId, "booked");
}

export function trackShared(experienceId: string) {
  trackInteraction(experienceId, "shared");
}

export function trackGifted(experienceId: string) {
  trackInteraction(experienceId, "gifted");
}

// â”€â”€â”€ Analytics helpers â”€â”€â”€

function getUserCategoryAffinity(experiences: Experience[]): Record<string, number> {
  const interactions = loadInteractions();
  const scores: Record<string, number> = {};

  for (const exp of experiences) {
    const expInteractions = interactions.filter((i) => i.experienceId === exp.id);
    if (expInteractions.length > 0) {
      const totalWeight = expInteractions.reduce((sum, i) => sum + i.weight, 0);
      scores[exp.category] = (scores[exp.category] || 0) + totalWeight;
    }
  }

  return scores;
}

function getViewedExperienceIds(): Set<string> {
  return new Set(loadInteractions().filter((i) => i.type === "viewed").map((i) => i.experienceId));
}

function getSavedExperienceIds(): Set<string> {
  return new Set(loadInteractions().filter((i) => i.type === "saved").map((i) => i.experienceId));
}

function getBookedExperienceIds(): Set<string> {
  return new Set(loadInteractions().filter((i) => i.type === "booked").map((i) => i.experienceId));
}

function getAllInteractedIds(): Set<string> {
  return new Set(loadInteractions().map((i) => i.experienceId));
}

// â”€â”€â”€ Time-based bonuses â”€â”€â”€

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

// â”€â”€â”€ Scored ranking â”€â”€â”€

function scoreExperiences(
  experiences: Experience[],
  categoryAffinity: Record<string, number>,
  userLocation?: Coordinates | null
): Experience[] {
  const interactedIds = getAllInteractedIds();
  const savedIds = getSavedExperienceIds();
  const bookedIds = getBookedExperienceIds();
  const timeBonus = getTimeOfDayBonus();
  const dayBonus = getDayOfWeekBonus();

  const scored = experiences.map((exp) => {
    let score = 0;

    // Category affinity: prefer categories user has engaged with
    score += (categoryAffinity[exp.category] || 0) * 2;

    // Saved/booked boost
    if (savedIds.has(exp.id)) score += 3;
    if (bookedIds.has(exp.id)) score += 5;

    // Not yet interacted: discovery bonus (promote new content)
    if (!interactedIds.has(exp.id)) score += 1;

    // Time/day bonuses
    score += timeBonus[exp.category] || 0;
    score += dayBonus[exp.category] || 0;

    // Quality bonus
    score += (exp.rating - 4) * 3;

    // Proximity bonus: boost experiences closer to user
    if (userLocation && exp.coordinates) {
      const dist = haversineDistance(userLocation, exp.coordinates);
      if (dist < 2) score += 3;       // walking distance
      else if (dist < 5) score += 2;  // short drive
      else if (dist < 15) score += 1; // within city
    }

    return { exp, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.exp);
}

// â”€â”€â”€ Public Rail Generators â”€â”€â”€

export function getPersonalizedRails(
  allExperiences: Experience[],
  location?: { lat: number; lng: number }
): DiscoveryRail[] {
  if (allExperiences.length === 0) return [];

  const categoryAffinity = getUserCategoryAffinity(allExperiences);
  const interactedIds = getAllInteractedIds();
  const scored = scoreExperiences(allExperiences, categoryAffinity, location);

  const rails: DiscoveryRail[] = [];

  // 1. Recommended For You (top scored)
  const topPicks = scored.slice(0, 10);
  if (topPicks.length > 0) {
    rails.push({
      key: "recommended",
      title: "Recommended For You",
      experiences: topPicks,
      subtitle: "Based on your interests",
      isPersonalized: true,
    });
  }

  // 2. Because You Like [Top Category]
  const sortedCats = Object.entries(categoryAffinity).sort(([, a], [, b]) => b - a);
  if (sortedCats.length > 0) {
    const [topCat] = sortedCats[0];
    const catExperiences = allExperiences
      .filter((e) => e.category === topCat && !interactedIds.has(e.id))
      .slice(0, 8);
    if (catExperiences.length >= 2) {
      rails.push({
        key: "because-you-like",
        title: `Because You Like ${topCat}`,
        experiences: catExperiences,
        subtitle: `More ${topCat.toLowerCase()} experiences you might love`,
        isPersonalized: true,
      });
    }
  }

  // 3. Trending Near You (highest rated, filtered by location if available)
  const trending = getTrending(allExperiences, 8);
  if (trending.length > 0) {
    rails.push({
      key: "trending",
      title: "Trending Right Now",
      experiences: trending,
    });
  }

  // 4. Popular This Weekend
  const weekend = getPopularThisWeekend(allExperiences, 8);
  if (weekend.length > 0) {
    rails.push({
      key: "weekend",
      title: "Popular This Weekend",
      experiences: weekend,
      subtitle: "Weekend favourites",
    });
  }

  return rails;
}

export function getTrending(experiences: Experience[], limit = 8): Experience[] {
  const interactions = loadInteractions();
  const viewCounts: Record<string, number> = {};

  for (const interaction of interactions) {
    if (interaction.type === "viewed") {
      viewCounts[interaction.experienceId] = (viewCounts[interaction.experienceId] || 0) + 1;
    }
  }

  const scored = experiences.map((exp) => ({
    exp,
    score: (viewCounts[exp.id] || 0) + exp.rating * 2,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.exp);
}

export function getPopularThisWeekend(experiences: Experience[], limit = 8): Experience[] {
  return experiences
    .filter((e) => e.rating >= 4.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function getPeopleAlsoBooked(
  experienceId: string,
  allExperiences: Experience[]
): Experience[] {
  const interactions = loadInteractions();

  // Find users who interacted with this experience
  const thisExpInteractions = interactions.filter((i) => i.experienceId === experienceId);
  if (thisExpInteractions.length === 0) {
    // Fallback: same category
    const exp = allExperiences.find((e) => e.id === experienceId);
    if (!exp) return [];
    return allExperiences
      .filter((e) => e.category === exp.category && e.id !== experienceId)
      .slice(0, 6);
  }

  // Find other experiences that the same users interacted with
  const interactedIds = thisExpInteractions.map((i) => i.id);
  const coOccurrences: Record<string, number> = {};

  for (const i of interactions) {
    if (i.experienceId !== experienceId) {
      coOccurrences[i.experienceId] = (coOccurrences[i.experienceId] || 0) + 1;
    }
  }

  const sorted = Object.entries(coOccurrences)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([id]) => allExperiences.find((e) => e.id === id))
    .filter((e): e is Experience => e !== undefined);

  return sorted;
}

export function getBasedOnHistory(
  experiences: Experience[],
  type: "viewed" | "saved" | "booked",
  limit = 8
): Experience[] {
  const ids = type === "viewed"
    ? getViewedExperienceIds()
    : type === "saved"
      ? getSavedExperienceIds()
      : getBookedExperienceIds();

  const categoryAffinity: Record<string, number> = {};
  for (const exp of experiences) {
    if (ids.has(exp.id)) {
      categoryAffinity[exp.category] = (categoryAffinity[exp.category] || 0) + 1;
    }
  }

  const topCat = Object.entries(categoryAffinity).sort(([, a], [, b]) => b - a)[0]?.[0];
  if (!topCat) return [];

  return scoreExperiences(
    experiences.filter((e) => e.category === topCat && !ids.has(e.id)),
    categoryAffinity,
    undefined
  ).slice(0, limit);
}

// â”€â”€â”€ Category-based recommendations â”€â”€â”€

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
  if (typeof window === "undefined") return false;
  try {
    const interactions = loadInteractions();
    return interactions.length > 0;
  } catch {
    return false;
  }
}

export function getPersonalizedRecommendations(
  experiences: Experience[],
  location?: { lat: number; lng: number }
): Experience[] {
  if (experiences.length === 0) return [];
  const categoryAffinity = getUserCategoryAffinity(experiences);
  return scoreExperiences(experiences, categoryAffinity, location).slice(0, 10);
}
