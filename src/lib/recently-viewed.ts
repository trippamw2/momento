/**
 * Recently Viewed — tracks experience detail page visits in localStorage.
 * Shared across Experiences, Saved, and Discover pages.
 */

const STORAGE_KEY = "experio-recently-viewed";
const MAX_ITEMS = 20;

export interface RecentlyViewedItem {
  id: string;
  timestamp: number;
}

function load(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: RecentlyViewedItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silently fail
  }
}

/** Call when visiting an experience detail page */
export function trackRecentlyViewed(experienceId: string): void {
  const items = load();
  // Remove duplicate if exists
  const filtered = items.filter((i) => i.id !== experienceId);
  // Add to front
  filtered.unshift({ id: experienceId, timestamp: Date.now() });
  // Trim to max
  save(filtered.slice(0, MAX_ITEMS));
}

/** Get the list of recently viewed items, newest first */
export function getRecentlyViewed(): RecentlyViewedItem[] {
  return load();
}
