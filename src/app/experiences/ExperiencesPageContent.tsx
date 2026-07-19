"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { Mood, PRICE_RANGES, Experience } from "@/lib/types";
import { useGeolocation, getDistance, formatDist } from "@/lib/use-geolocation";
import { AFRICAN_CITY_COORDS, findNearestCity } from "@/lib/geo";
import { experiences as mockExperiences } from "@/lib/data";
import ExperienceCard from "@/components/ExperienceCard";
import { trackRecentlyViewed } from "@/lib/recently-viewed";

const ITEMS_PER_PAGE = 8;
const LOAD_MORE = 4;

const MOOD_LABELS: { label: Mood; description: string; symbol: string; accent: string }[] = [
  { label: "Romantic", description: "Perfect for two", symbol: "♡", accent: "from-rose-500 to-pink-500" },
  { label: "Relaxed", description: "Unwind and recharge", symbol: "≈", accent: "from-emerald-500 to-teal-500" },
  { label: "Social", description: "Connect with others", symbol: "▣", accent: "from-pink-500 to-rose-500" },
  { label: "Culinary", description: "Food lovers", symbol: "✦", accent: "from-amber-600 to-orange-600" },
  { label: "Active", description: "Get moving", symbol: "▲", accent: "from-red-500 to-rose-500" },
  { label: "Luxurious", description: "You deserve it", symbol: "★", accent: "from-fuchsia-500 to-purple-500" },
  { label: "Celebratory", description: "Make it special", symbol: "◆", accent: "from-amber-500 to-orange-500" },
  { label: "Creative", description: "Artsy fun", symbol: "✎", accent: "from-violet-500 to-purple-500" },
];

function parseMoodParam(value: string | null): Mood | null {
  if (!value) return null;
  const match = MOOD_LABELS.find((m) => m.label.toLowerCase().replace(" ", "-") === value.toLowerCase());
  return match ? match.label : null;
}

function filterExperiences(exps: Experience[], opts: {
  search?: string;
  category?: string;
  mood?: Mood | null;
  priceRange?: string;
  location?: string;
  nearby?: boolean;
  userLocation?: { lat: number; lng: number };
}): Experience[] {
  let result = [...exps];
  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.subtitle.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  }
  if (opts.category && opts.category !== "All") {
    result = result.filter((e) => e.category === opts.category);
  }
  if (opts.mood) {
    result = result.filter((e) => e.mood.includes(opts.mood as Mood));
  }
  if (opts.priceRange && opts.priceRange !== "all") {
    const [min, max] = opts.priceRange.split("-").map(Number);
    result = result.filter((e) => e.price >= min && e.price <= max);
  }
  if (opts.location && opts.location !== "All") {
    result = result.filter((e) => e.location === opts.location);
  }
  if (opts.nearby && opts.userLocation) {
    result = result
      .map((e) => ({
        ...e,
        distance: formatDist(getDistance(opts.userLocation!, e.coordinates)),
      }))
      .sort((a, b) => {
        const dA = getDistance(opts.userLocation!, a.coordinates);
        const dB = getDistance(opts.userLocation!, b.coordinates);
        return dA - dB;
      });
  }
  return result;
}

interface FilterState {
  search: string;
  category: string;
  mood: Mood | null;
  price: string;
  location: string;
  nearby: boolean;
  sortBy: string;
}

function initialState(sp: URLSearchParams): FilterState {
  return {
    search: sp.get("q") || "",
    category: sp.get("category") || "All",
    mood: parseMoodParam(sp.get("mood")),
    price: sp.get("price") || "all",
    location: sp.get("location") || "All",
    nearby: sp.get("nearby") === "true",
    sortBy: sp.get("sort") || "recommended",
  };
}

// ─── Filter Sheet Component ───

function FilterSheet({
  filters,
  onApply,
  onClose,
  locations,
  geo,
}: {
  filters: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
  locations: string[];
  geo: { position: { lat: number; lng: number } | null; loading: boolean; requestPosition: () => void };
}) {
  const [draft, setDraft] = useState<FilterState>({ ...filters });

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const activeCount = [
    draft.mood ? 1 : 0,
    draft.price !== "all" ? 1 : 0,
    draft.location !== "All" ? 1 : 0,
    draft.nearby ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-white/[0.08] max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="sticky top-0 z-10 bg-[#111827] pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-6 pb-3 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Filters</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.05] text-white/50 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: "calc(80vh - 140px)" }}>
          {/* Mood */}
          <section>
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-medium mb-3">Mood</h3>
            <div className="flex flex-wrap gap-2">
              {MOOD_LABELS.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => set("mood", draft.mood === mood.label ? null : mood.label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    draft.mood === mood.label
                      ? "bg-[#FF0F73] text-white"
                      : "bg-[#1A2332] text-white/50 border border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  <span>{mood.symbol}</span>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Price Range */}
          <section>
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-medium mb-3">Price Range</h3>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((pr) => (
                <button
                  key={pr.value}
                  onClick={() => set("price", pr.value)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    draft.price === pr.value
                      ? "bg-[#FF0F73] text-white"
                      : "bg-[#1A2332] text-white/50 border border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </section>

          {/* Location */}
          <section>
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-medium mb-3">Location</h3>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => set("location", loc)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    draft.location === loc
                      ? "bg-[#FF0F73] text-white"
                      : "bg-[#1A2332] text-white/50 border border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  {loc === "All" ? "All Locations" : loc}
                </button>
              ))}
            </div>
          </section>

          {/* Nearby */}
          <section>
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-medium mb-3">Distance</h3>
            <button
              onClick={() => {
                if (!draft.nearby && !geo.position && !geo.loading) {
                  geo.requestPosition();
                }
                set("nearby", !draft.nearby);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full ${
                draft.nearby
                  ? "bg-[#FF0F73]/10 text-[#FF0F73] border border-[#FF0F73]/20"
                  : "bg-[#1A2332] text-white/50 border border-white/[0.08] hover:border-white/20"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                draft.nearby ? "bg-[#FF0F73] border-[#FF0F73]" : "border-white/20"
              }`}>
                {draft.nearby && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span>Show experiences near me</span>
              {geo.loading && <span className="text-xs text-white/30 animate-pulse">Locating...</span>}
            </button>
          </section>

          {/* Sort */}
          <section>
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-medium mb-3">Sort By</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "recommended", label: "Recommended" },
                { value: "price-asc", label: "Price: Low to High" },
                { value: "price-desc", label: "Price: High to Low" },
                { value: "rating", label: "Rating" },
                { value: "newest", label: "Newest" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("sortBy", opt.value)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    draft.sortBy === opt.value
                      ? "bg-[#FF0F73] text-white"
                      : "bg-[#1A2332] text-white/50 border border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#111827] border-t border-white/[0.06] p-4 flex gap-3">
          <button
            onClick={() => {
              setDraft({ search: filters.search, category: filters.category, mood: null, price: "all", location: "All", nearby: false, sortBy: "recommended" });
            }}
            className="flex-1 py-3 rounded-xl bg-[#1E293B] text-white/60 text-sm font-medium hover:bg-white/[0.05] transition-all"
          >
            Clear
          </button>
          <button
            onClick={() => { onApply(draft); onClose(); }}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white text-sm font-semibold hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all"
          >
            {activeCount > 0 ? `Apply (${activeCount})` : "Show Results"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Content ───

export default function ExperiencesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(() => initialState(searchParams));
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(false);
  const [allExperiences, setAllExperiences] = useState<Experience[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const geo = useGeolocation();

  // Tracks whether the user manually chose a location (vs auto-detect)
  const manualLocationOverride = useRef(false);

  // Auto-detect city from GPS
  useEffect(() => {
    if (geo.position && filters.location === "All" && !manualLocationOverride.current) {
      const city = findNearestCity(geo.position.lat, geo.position.lng);
      if (city) {
        setFilters((prev) => ({ ...prev, location: city }));
      }
    }
  }, [geo.position, filters.location]);

  // Request GPS on mount
  useEffect(() => {
    if (!geo.position && !geo.loading && !geo.error && geo.permission === "prompt") {
      const t = setTimeout(() => geo.requestPosition(), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    getExperiences({ limit: 50 })
      .then((res) => {
        const mapped = (res.experiences as Record<string, unknown>[]).map(transformExperience);
        setAllExperiences(mapped.length > 0 ? mapped : mockExperiences);
      })
      .catch(() => {
        setAllExperiences(mockExperiences);
      })
      .finally(() => setFetching(false));
  }, []);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    if (key === "location") {
      manualLocationOverride.current = true;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
    setVisibleCount(ITEMS_PER_PAGE);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: "", category: "All", mood: null, price: "all", location: "All", nearby: false, sortBy: "recommended" });
    setVisibleCount(ITEMS_PER_PAGE);
  }, []);

  const categories = useMemo(() => {
    return ["All", ...new Set(allExperiences.map((e) => e.category))] as string[];
  }, [allExperiences]);

  const locations = useMemo(() => {
    return ["All", ...new Set(allExperiences.map((e) => e.location))] as string[];
  }, [allExperiences]);

  const filtered = useMemo(() => {
    let result = filterExperiences(allExperiences, {
      search: filters.search,
      category: filters.category,
      mood: filters.mood,
      priceRange: filters.price,
      location: filters.location,
      nearby: filters.nearby,
      userLocation: filters.nearby ? geo.position ?? undefined : undefined,
    });
    // Apply sort
    switch (filters.sortBy) {
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result = [...result].reverse();
        break;
      // "recommended" = default order
    }
    return result;
  }, [allExperiences, filters, geo.position]);

  const visibleExperiences = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + LOAD_MORE);
      setLoading(false);
    }, 250);
  }, [loading, hasMore]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.category !== "All") params.set("category", filters.category);
    if (filters.mood) params.set("mood", filters.mood.toLowerCase().replace(" ", "-"));
    if (filters.price !== "all") params.set("price", filters.price);
    if (filters.location !== "All") params.set("location", filters.location);
    if (filters.nearby) params.set("nearby", "true");
    if (filters.sortBy !== "recommended") params.set("sort", filters.sortBy);
    const qs = params.toString();
    router.replace(qs ? `/experiences?${qs}` : "/experiences", { scroll: false });
  }, [filters, router]);

  // Count active filters (excluding search and category)
  const activeFilterCount = [
    filters.mood ? 1 : 0,
    filters.price !== "all" ? 1 : 0,
    filters.location !== "All" ? 1 : 0,
    filters.nearby ? 1 : 0,
    filters.sortBy !== "recommended" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="pt-20 pb-16 min-h-screen bg-[#05070B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-6">
          <h1 className="text-display-sm font-bold text-[#F1F5F9] mb-1">
            All <span className="bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] bg-clip-text text-transparent">Experiences</span>
          </h1>
          <p className="text-[#CBD5E1] text-body-lg">{filtered.length} moments to discover</p>
          {geo.position && filters.location !== "All" && (
            <p className="text-caption text-[#FF0F73] mt-1">
              <svg className="w-3.5 h-3.5 inline shrink-0 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Showing experiences near <strong>{filters.location}</strong>
            </p>
          )}
          {geo.loading && !geo.position && (
            <p className="text-caption text-[#64748B] mt-1 animate-pulse">Detecting your location...</p>
          )}
        </div>

        {/* Search + Filters row */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-xl">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by title, location, category..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full pl-12 pr-10 py-3 rounded-xl bg-[#1A2332] border border-white/[0.08] text-[#F1F5F9] text-body placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/30 transition-all shadow-xs"
            />
            {filters.search && (
              <button onClick={() => updateFilter("search", "")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-text-secondary text-sm">
                ✕
              </button>
            )}
          </div>

          {/* Filters button */}
          <button
            onClick={() => setShowFilters(true)}
            className={`shrink-0 px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
              activeFilterCount > 0
                ? "bg-[#FF0F73]/10 text-[#FF0F73] border-[#FF0F73]/20"
                : "bg-[#1A2332] text-[#CBD5E1] border-white/[0.08] hover:border-white/20"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FF0F73] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Category pills (stay visible) */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter("category", cat)}
              className={`px-4 py-2 rounded-full text-body-sm font-medium whitespace-nowrap transition-all duration-200 ${
                filters.category === cat
                  ? "bg-[#FF0F73] text-white shadow-sm shadow-[#FF0F73]/20"
                  : "bg-[#1A2332] text-[#CBD5E1] border border-white/[0.08] hover:bg-white/[0.05] hover:text-[#F1F5F9] hover:border-[#FF0F73]/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Active filter chips (quick-removable) */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.mood && (
              <button onClick={() => updateFilter("mood", null)} className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF0F73]/10 text-[#FF0F73] text-[11px] font-medium">
                {filters.mood} <span className="text-[#FF0F73]/60 ml-1">✕</span>
              </button>
            )}
            {filters.price !== "all" && (
              <button onClick={() => updateFilter("price", "all")} className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF0F73]/10 text-[#FF0F73] text-[11px] font-medium">
                {PRICE_RANGES.find(p => p.value === filters.price)?.label} <span className="text-[#FF0F73]/60 ml-1">✕</span>
              </button>
            )}
            {filters.location !== "All" && (
              <button onClick={() => updateFilter("location", "All")} className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF0F73]/10 text-[#FF0F73] text-[11px] font-medium">
                {filters.location} <span className="text-[#FF0F73]/60 ml-1">✕</span>
              </button>
            )}
            {filters.nearby && (
              <button onClick={() => updateFilter("nearby", false)} className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF0F73]/10 text-[#FF0F73] text-[11px] font-medium">
                Near Me <span className="text-[#FF0F73]/60 ml-1">✕</span>
              </button>
            )}
            {filters.sortBy !== "recommended" && (
              <button onClick={() => updateFilter("sortBy", "recommended")} className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF0F73]/10 text-[#FF0F73] text-[11px] font-medium">
                Sort: {filters.sortBy === "price-asc" ? "Low Price" : filters.sortBy === "price-desc" ? "High Price" : filters.sortBy === "rating" ? "Rating" : "Newest"} <span className="text-[#FF0F73]/60 ml-1">✕</span>
              </button>
            )}
            <button onClick={clearFilters} className="px-3 py-1 rounded-full text-[11px] text-white/30 hover:text-white/50 transition-all">
              Clear all
            </button>
          </div>
        )}

        {/* Results */}
        {visibleExperiences.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-caption text-[#CBD5E1]">
                Showing {visibleExperiences.length} of {filtered.length} experience{filtered.length !== 1 ? "s" : ""}
              </p>
              {filters.search && (
                <p className="text-caption text-[#FF0F73] font-medium">
                  Results for &ldquo;{filters.search}&rdquo;
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visibleExperiences.map((exp) => (
                <div key={exp.id} onClick={() => trackRecentlyViewed(exp.id)}>
                  <ExperienceCard experience={exp} size="sm" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-heading-md font-bold text-[#F1F5F9] mb-2">No experiences found</p>
            <p className="text-body text-[#CBD5E1] mb-6">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 rounded-full bg-[#FF0F73] text-white text-body-sm font-semibold shadow-[0_4px_16px_rgba(255, 15, 115, 0.2)] hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.35)] transition-all duration-300"
            >
              Clear all filters
            </button>
          </div>
        )}

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 border-brand-pink/30 border-t-brand-pink animate-spin" />
          </div>
        )}

        {!hasMore && filtered.length > 0 && (
          <p className="text-center text-caption text-[#64748B] py-8">
            You&apos;ve seen them all
          </p>
        )}
      </div>

      {/* Filter Sheet Modal */}
      {showFilters && (
        <FilterSheet
          filters={filters}
          onApply={(f) => {
            setFilters(f);
            setVisibleCount(ITEMS_PER_PAGE);
          }}
          onClose={() => setShowFilters(false)}
          locations={locations}
          geo={geo}
        />
      )}
    </div>
  );
}
