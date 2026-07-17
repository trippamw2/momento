"use client";

import { Experience, UserInteraction, Coordinates, DiscoveryRail } from "@/lib/types";
import { haversineDistance } from "@/lib/geo";

// ─── Types ───

export interface ScoringSignals {
  // User behavior signals
  views: number;
  likes: number;
  saves: number;
  shares: number;
  bookings: number;
  gifts: number;
  watchTime: number;
  scrollDepth: number;
  repeatVisits: number;
  sessionDuration: number;

  // Social graph signals
  friendsActivity: number;
  follows: number;
  coEngagement: number;

  // Temporal & contextual signals
  timeOfDay: number;
  dayOfWeek: number;
  season: number;
  weather: number;
  hourPattern: number[];
  weekdayPattern: number[];
  locationDensity: number;

  // Quality & trend signals
  rating: number;
  reviewCount: number;
  completionRate: number;
  conversionRate: number;
  growthVelocity: number;
  freshnessScore: number;

  // Content engagement signals
  contentLength: number;
  mediaTypeWeight: number;
  emotionalKeywords: number;

  // External factors
  eventsNearby: number;
  competitorDensity: number;
  localFestivals: number;
  trendingInCities: number[];
  socialMediaBuzz: number;

  // Historical patterns
  bookingHistory: number;
  savedItems: number;
  abandonedCart: number;
  lastMinuteBookings: number;
  seasonalRepeat: number;
}

export interface TrendingConfig {
  weights: Record<string, number>;
  decayRate: number; // per day
  maxAge: number; // days
  minInteractions: number;
}

export const DEFAULT_TRENDING_CONFIG: TrendingConfig = {
  weights: {
    // User behavior (high weight - direct engagement)
    views: 1.0,
    likes: 2.0,
    saves: 3.0,
    shares: 4.0,
    bookings: 5.0,
    gifts: 5.0,
    watchTime: 2.5,
    scrollDepth: 1.5,
    repeatVisits: 2.0,
    sessionDuration: 1.5,

    // Social graph (medium-high weight)
    friendsActivity: 3.0,
    follows: 2.0,
    coEngagement: 2.5,

    // Temporal & contextual (medium weight)
    timeOfDay: 2.0,
    dayOfWeek: 1.5,
    season: 1.5,
    weather: 1.5,
    hourPattern: 1.0,
    weekdayPattern: 1.0,
    locationDensity: 2.5,

    // Quality & trend (high weight)
    rating: 3.0,
    reviewCount: 2.0,
    completionRate: 3.0,
    conversionRate: 4.0,
    growthVelocity: 3.5,
    freshnessScore: 2.0,

    // Content engagement (medium weight)
    contentLength: 1.0,
    mediaTypeWeight: 2.0,
    emotionalKeywords: 1.5,

    // External factors (medium weight)
    eventsNearby: 2.5,
    competitorDensity: 1.0,
    localFestivals: 2.0,
    trendingInCities: 1.5,
    socialMediaBuzz: 2.0,

    // Historical patterns (medium-high weight)
    bookingHistory: 2.5,
    savedItems: 2.0,
    abandonedCart: 1.5,
    lastMinuteBookings: 2.0,
    seasonalRepeat: 2.0,
  },
  decayRate: 0.15, // 15% per day
  maxAge: 30, // 30 days
  minInteractions: 5,
};

// ─── Storage ───

const STORAGE_KEYS = {
  INTERACTIONS: "experio-interactions",
  TRENDING_CACHE: "experio-trending-cache",
  USER_PROFILE: "experio-user-profile",
} as const;

interface StoredInteraction extends UserInteraction {
  metadata?: Record<string, unknown>;
}

function loadInteractions(): StoredInteraction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveInteractions(interactions: StoredInteraction[]) {
  try {
    // Keep only last 500 interactions
    localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions.slice(-500)));
  } catch (e) {
    console.warn("Failed to save interactions:", e);
  }
}

function loadTrendingCache(): { timestamp: number; data: Experience[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRENDING_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTrendingCache(data: Experience[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRENDING_CACHE, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch (e) {
    console.warn("Failed to save trending cache:", e);
  }
}

// ─── Tracking Functions ───

const WEIGHT_MAP: Record<UserInteraction["type"], number> = {
  viewed: 1,
  liked: 2,
  saved: 3,
  shared: 4,
  gifted: 5,
  booked: 5,
};

export function trackInteraction(
  experienceId: string, 
  type: UserInteraction["type"],
  metadata?: Record<string, unknown>
) {
  const interactions = loadInteractions();
  interactions.push({
    id: `${experienceId}-${type}-${Date.now()}`,
    experienceId,
    type,
    timestamp: Date.now(),
    weight: WEIGHT_MAP[type],
    metadata,
  });
  saveInteractions(interactions);
}

export function trackView(experienceId: string, metadata?: { duration?: number; scrollDepth?: number }) {
  trackInteraction(experienceId, "viewed", metadata);
}

export function trackLike(experienceId: string) {
  trackInteraction(experienceId, "liked");
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

// ─── Analytics Helpers ───

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

// ─── Time-based Bonuses ───

function getTimeOfDayBonus(): Record<string, number> {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return { Celebrate: 3, Chill: 1, Date: 2 };
  if (hour >= 12 && hour < 17) return { Chill: 2, Celebrate: 1, Active: 1 };
  if (hour >= 17 && hour < 22) return { Date: 3, Escape: 2, Celebrate: 1, Social: 2 };
  return { Escape: 2, Date: 1, Nightlife: 1 };
}

function getDayOfWeekBonus(): Record<string, number> {
  const day = new Date().getDay();
  if (day === 5 || day === 6) return { Date: 2, Escape: 2, Chill: 1, Social: 2, Celebrate: 2 };
  if (day === 0) return { Celebrate: 3, Chill: 2, Escape: 1 };
  return { Chill: 1, Social: 1 };
}

function getSeasonBonus(): Record<string, number> {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return { Escape: 2, Nature: 2, Adventure: 1 }; // Spring
  if (month >= 5 && month <= 7) return { Chill: 2, Social: 2, Adventure: 2, Nightlife: 1 }; // Summer
  if (month >= 8 && month <= 10) return { Escape: 2, Culinary: 2, Creative: 1 }; // Autumn
  return { Celebrate: 3, Luxury: 2, Romantic: 1 }; // Winter
}

// ─── Scoring Engine ───

function scoreExperiences(
  experiences: Experience[],
  categoryAffinity: Record<string, number>,
  userLocation?: Coordinates | null,
  config: TrendingConfig = DEFAULT_TRENDING_CONFIG
): Experience[] {
  const interactedIds = getAllInteractedIds();
  const savedIds = getSavedExperienceIds();
  const bookedIds = getBookedExperienceIds();
  const timeBonus = getTimeOfDayBonus();
  const dayBonus = getDayOfWeekBonus();
  const seasonBonus = getSeasonBonus();

  const scored = experiences.map((exp) => {
    let score = 0;
    const now = Date.now();
    const ageMs = now - (exp.createdAt ? new Date(exp.createdAt).getTime() : now);
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // 1. Category affinity: prefer categories user has engaged with
    score += (categoryAffinity[exp.category] || 0) * config.weights.categoryAffinity || 0;

    // 2. Saved/booked boost
    if (savedIds.has(exp.id)) score += config.weights.saves || 3;
    if (bookedIds.has(exp.id)) score += config.weights.bookings || 5;

    // 3. Discovery bonus for new content
    if (!interactedIds.has(exp.id)) score += config.weights.freshnessScore || 2;

    // 4. Time/day/season bonuses
    score += (timeBonus[exp.category] || 0) * (config.weights.timeOfDay || 2);
    score += (dayBonus[exp.category] || 0) * (config.weights.dayOfWeek || 1.5);
    score += (seasonBonus[exp.category] || 0) * (config.weights.season || 1.5);

    // 5. Quality bonus
    score += (exp.rating - 4) * (config.weights.rating || 3);

    // 6. Proximity bonus
    if (userLocation && exp.coordinates) {
      const dist = haversineDistance(userLocation, exp.coordinates);
      if (dist < 2) score += 3;        // walking distance
      else if (dist < 5) score += 2;   // short drive
      else if (dist < 15) score += 1;  // within city
    }

    // 7. Social proof
    score += Math.min(exp.reviewCount / 10, 5) * (config.weights.reviewCount || 2);

    // 8. Growth velocity (new experiences trending)
    const growthScore = calculateGrowthVelocity(exp.id);
    score += growthScore * (config.weights.growthVelocity || 3.5);

    // 9. Decay for older content
    if (ageDays > config.maxAge) {
      score *= Math.pow(1 - config.decayRate, ageDays - config.maxAge);
    }

    // 10. Media type bonus
    if (exp.media && exp.media.length > 1) {
      score += 1 * (config.weights.mediaTypeWeight || 2);
    }

    // 11. UGC bonus
    if (exp.ugc && exp.ugc.length > 0) {
      score += Math.min(exp.ugc.length * 0.5, 3) * (config.weights.socialMediaBuzz || 2);
    }

    // 12. Host profile bonus
    if (exp.hostProfile) {
      score += 0.5;
    }

    return { exp, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.exp);
}

function calculateGrowthVelocity(experienceId: string): number {
  const interactions = loadInteractions();
  const expInteractions = interactions.filter((i) => i.experienceId === experienceId);
  
  if (expInteractions.length < 5) return 0;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Count interactions in last 7 days vs previous 7 days
  const last7Days = expInteractions.filter(i => now - i.timestamp < 7 * dayMs).length;
  const prev7Days = expInteractions.filter(i => 
    now - i.timestamp >= 7 * dayMs && now - i.timestamp < 14 * dayMs
  ).length;

  if (prev7Days === 0) return last7Days > 0 ? 1 : 0;
  
  return Math.min(last7Days / prev7Days, 5); // Cap at 5x growth
}

// ─── Public Rail Generators ───

export function getPersonalizedRails(
  allExperiences: Experience[],
  location?: Coordinates | null,
  config: TrendingConfig = DEFAULT_TRENDING_CONFIG
): DiscoveryRail[] {
  if (allExperiences.length === 0) return [];

  const categoryAffinity = getUserCategoryAffinity(allExperiences);
  const interactedIds = getAllInteractedIds();
  const scored = scoreExperiences(allExperiences, categoryAffinity, location, config);

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

  // 3. Trending Right Now (using trending algorithm)
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

  // 5. Hidden Gems (high rating, low reviews)
  const hiddenGems = allExperiences
    .filter(e => e.rating >= 4.5 && e.reviewCount < 20 && !interactedIds.has(e.id))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);
  if (hiddenGems.length > 0) {
    rails.push({
      key: "hidden-gems",
      title: "Hidden Gems",
      experiences: hiddenGems,
      subtitle: "Highly rated, waiting to be discovered",
    });
  }

  // 6. Free Experiences
  const free = allExperiences
    .filter(e => e.price === 0)
    .slice(0, 8);
  if (free.length > 0) {
    rails.push({
      key: "free",
      title: "Free Experiences",
      experiences: free,
      subtitle: "No cost, all fun",
    });
  }

  // 7. Luxury Picks
  const luxury = allExperiences
    .filter(e => e.price >= 100000 && e.rating >= 4.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);
  if (luxury.length > 0) {
    rails.push({
      key: "luxury",
      title: "Luxury Picks",
      experiences: luxury,
      subtitle: "Premium experiences",
    });
  }

  // 8. Nearby (if location available)
  if (location) {
    const nearby = allExperiences
      .filter(e => e.coordinates && haversineDistance(location, e.coordinates) < 15)
      .sort((a, b) => haversineDistance(location, a.coordinates!) - haversineDistance(location, b.coordinates!))
      .slice(0, 8);
    if (nearby.length > 0) {
      rails.push({
        key: "nearby",
        title: "Near You",
        experiences: nearby,
        subtitle: "Experiences within 15km",
      });
    }
  }

  return rails;
}

export function getTrending(
  experiences: Experience[], 
  limit = 8,
  config: TrendingConfig = DEFAULT_TRENDING_CONFIG
): Experience[] {
  const interactions = loadInteractions();
  const viewCounts: Record<string, number> = {};
  const likeCounts: Record<string, number> = {};
  const saveCounts: Record<string, number> = {};
  const shareCounts: Record<string, number> = {};
  const bookingCounts: Record<string, number> = {};

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const interaction of interactions) {
    // Only count recent interactions (last 30 days)
    if (now - interaction.timestamp > 30 * dayMs) continue;
    
    const weight = Math.pow(1 - config.decayRate, (now - interaction.timestamp) / (1000 * 60 * 60 * 24));
    
    switch (interaction.type) {
      case "viewed":
        viewCounts[interaction.experienceId] = (viewCounts[interaction.experienceId] || 0) + weight;
        break;
      case "liked":
        likeCounts[interaction.experienceId] = (likeCounts[interaction.experienceId] || 0) + weight;
        break;
      case "saved":
        saveCounts[interaction.experienceId] = (saveCounts[interaction.experienceId] || 0) + weight;
        break;
      case "shared":
        shareCounts[interaction.experienceId] = (shareCounts[interaction.experienceId] || 0) + weight;
        break;
      case "booked":
        bookingCounts[interaction.experienceId] = (bookingCounts[interaction.experienceId] || 0) + weight;
        break;
    }
  }

  const scored = experiences.map((exp) => ({
    exp,
    score: 
      (viewCounts[exp.id] || 0) * 1.0 +
      (likeCounts[exp.id] || 0) * 2.0 +
      (saveCounts[exp.id] || 0) * 3.0 +
      (shareCounts[exp.id] || 0) * 4.0 +
      (bookingCounts[exp.id] || 0) * 5.0 +
      exp.rating * 2 +
      (exp.ugc && exp.ugc.length > 0 ? exp.ugc.length * 0.5 : 0) +
      (exp.featured ? 3 : 0)
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

  const thisExpInteractions = interactions.filter((i) => i.experienceId === experienceId);
  if (thisExpInteractions.length === 0) {
    const exp = allExperiences.find((e) => e.id === experienceId);
    if (!exp) return [];
    return allExperiences
      .filter((e) => e.category === exp.category && e.id !== experienceId)
      .slice(0, 6);
  }

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

// ─── Category-based recommendations ───

export function getRecommendedCategories(experiences: Experience[]): string[] {
  const timeBonus = getTimeOfDayBonus();
  const dayBonus = getDayOfWeekBonus();
  const seasonBonus = getSeasonBonus();
  const scores: Record<string, number> = {};
  for (const cat of [...new Set(experiences.map((e) => e.category))]) {
    scores[cat] = (timeBonus[cat] || 0) + (dayBonus[cat] || 0) + (seasonBonus[cat] || 0);
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
  location?: Coordinates | null
): Experience[] {
  if (experiences.length === 0) return [];
  const categoryAffinity = getUserCategoryAffinity(experiences);
  return scoreExperiences(experiences, categoryAffinity, location).slice(0, 10);
}

// ─── Trending Labels Generator ───

export interface TrendingLabel {
  label: string;
  experiences: Experience[];
  type: "trending" | "loved" | "rated" | "rising" | "popular_nearby" | "gifted" | "weekend" | "sold_out" | "local_fav" | "hidden";
}

export function getTrendingLabels(
  experiences: Experience[],
  location?: Coordinates | null
): TrendingLabel[] {
  const labels: TrendingLabel[] = [];
  const interactions = loadInteractions();
  const viewCounts: Record<string, number> = {};

  for (const interaction of interactions) {
    if (interaction.type === "viewed") {
      viewCounts[interaction.experienceId] = (viewCounts[interaction.experienceId] || 0) + 1;
    }
  }

  // 🔥 Trending
  const trending = getTrending(experiences, 6);
  if (trending.length > 0) {
    labels.push({ label: "🔥 Trending", experiences: trending, type: "trending" });
  }

  // ❤️ Most Loved
  const mostLoved = experiences
    .filter(e => e.rating >= 4.8)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 6);
  if (mostLoved.length > 0) {
    labels.push({ label: "❤️ Most Loved", experiences: mostLoved, type: "loved" });
  }

  // ⭐ Highly Rated
  const highlyRated = experiences
    .filter(e => e.rating >= 4.7 && e.reviewCount >= 20)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
  if (highlyRated.length > 0) {
    labels.push({ label: "⭐ Highly Rated", experiences: highlyRated, type: "rated" });
  }

  // 📈 Rising Fast
  const rising = experiences
    .filter(e => calculateGrowthVelocity(e.id) > 2)
    .sort((a, b) => calculateGrowthVelocity(b.id) - calculateGrowthVelocity(a.id))
    .slice(0, 6);
  if (rising.length > 0) {
    labels.push({ label: "📈 Rising Fast", experiences: rising, type: "rising" });
  }

  // 🏆 Popular Near You
  if (location) {
    const nearby = experiences
      .filter(e => e.coordinates && haversineDistance(location, e.coordinates) < 15)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
    if (nearby.length > 0) {
      labels.push({ label: "🏆 Popular Near You", experiences: nearby, type: "popular_nearby" });
    }
  }

  // 🎁 Most Gifted
  const gifted = experiences
    .filter(e => e.giftCount && e.giftCount > 0)
    .sort((a, b) => (b.giftCount || 0) - (a.giftCount || 0))
    .slice(0, 6);
  if (gifted.length > 0) {
    labels.push({ label: "🎁 Most Gifted", experiences: gifted, type: "gifted" });
  }

  // This Weekend
  const weekend = getPopularThisWeekend(experiences, 6);
  if (weekend.length > 0) {
    labels.push({ label: "This Weekend", experiences: weekend, type: "weekend" });
  }

  // Almost Sold Out
  const soldOut = experiences
    .filter(e => e.capacity > 0 && e.bookedCount && e.bookedCount / e.capacity > 0.8)
    .slice(0, 6);
  if (soldOut.length > 0) {
    labels.push({ label: "Almost Sold Out", experiences: soldOut, type: "sold_out" });
  }

  // Local Favourite
  if (location) {
    const local = experiences
      .filter(e => e.coordinates && haversineDistance(location, e.coordinates) < 10)
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 6);
    if (local.length > 0) {
      labels.push({ label: "Local Favourite", experiences: local, type: "local_fav" });
    }
  }

  // Hidden Gems
  const hidden = experiences
    .filter(e => e.rating >= 4.5 && e.reviewCount < 15)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
  if (hidden.length > 0) {
    labels.push({ label: "Hidden Gems", experiences: hidden, type: "hidden" });
  }

  return labels;
}