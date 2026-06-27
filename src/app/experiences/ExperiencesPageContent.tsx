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

const ITEMS_PER_PAGE = 8;
const LOAD_MORE = 4;

const MOOD_LABELS: { label: Mood; description: string; emoji: string; accent: string }[] = [
  { label: "Romantic", description: "Perfect for two", emoji: "🌹", accent: "from-rose-500 to-pink-500" },
  { label: "Relaxed", description: "Unwind and recharge", emoji: "🌊", accent: "from-emerald-500 to-teal-500" },
  { label: "Social", description: "Connect with others", emoji: "💬", accent: "from-pink-500 to-rose-500" },
  { label: "Culinary", description: "Food lovers", emoji: "🍽️", accent: "from-amber-600 to-orange-600" },
  { label: "Active", description: "Get moving", emoji: "🧗", accent: "from-red-500 to-rose-500" },
  { label: "Luxurious", description: "You deserve it", emoji: "✨", accent: "from-fuchsia-500 to-purple-500" },
  { label: "Celebratory", description: "Make it special", emoji: "🥂", accent: "from-amber-500 to-orange-500" },
  { label: "Creative", description: "Artsy fun", emoji: "🎨", accent: "from-violet-500 to-purple-500" },
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
    result = result.filter((e) => e.mood.includes(opts.mood as any));
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
}

function initialState(sp: URLSearchParams): FilterState {
  return {
    search: sp.get("q") || "",
    category: sp.get("category") || "All",
    mood: parseMoodParam(sp.get("mood")),
    price: sp.get("price") || "all",
    location: sp.get("location") || "All",
    nearby: sp.get("nearby") === "true",
  };
}

export default function ExperiencesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(() => initialState(searchParams));
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(false);
  const [allExperiences, setAllExperiences] = useState<Experience[]>([]);
  const [fetching, setFetching] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const geo = useGeolocation();

  // Tracks whether the user manually chose a location (vs auto-detect)
  const manualLocationOverride = useRef(false);

  // ─── Auto-detect city from GPS ───
  // When GPS position arrives and location is still "All", auto-set nearest city
  useEffect(() => {
    if (geo.position && filters.location === "All" && !manualLocationOverride.current) {
      const city = findNearestCity(geo.position.lat, geo.position.lng);
      if (city) {
        setFilters((prev) => ({ ...prev, location: city }));
      }
    }
  }, [geo.position, filters.location]);

  // Request GPS on mount (non-blocking, small delay so page renders first)
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
    setFilters({ search: "", category: "All", mood: null, price: "all", location: "All", nearby: false });
    setVisibleCount(ITEMS_PER_PAGE);
  }, []);

  const categories = useMemo(() => {
    return ["All", ...new Set(allExperiences.map((e) => e.category))] as string[];
  }, [allExperiences]);

  const locations = useMemo(() => {
    return ["All", ...new Set(allExperiences.map((e) => e.location))] as string[];
  }, [allExperiences]);

  const filtered = useMemo(
    () =>
      filterExperiences(allExperiences, {
        search: filters.search,
        category: filters.category,
        mood: filters.mood,
        priceRange: filters.price,
        location: filters.location,
        nearby: filters.nearby,
        userLocation: filters.nearby ? geo.position ?? undefined : undefined,
      }),
    [allExperiences, filters, geo.position]
  );

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
    const qs = params.toString();
    router.replace(qs ? `/experiences?${qs}` : "/experiences", { scroll: false });
  }, [filters, router]);

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <h1 className="text-display-sm font-bold text-[#F1F5F9] mb-1">
            All <span className="bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] bg-clip-text text-transparent">Experiences</span>
          </h1>
          <p className="text-[#CBD5E1] text-body-lg">{filtered.length} moments to discover</p>
          {geo.position && filters.location !== "All" && (
            <p className="text-caption text-[#FF2D7A] mt-1">
              📍 Showing experiences near <strong>{filters.location}</strong>
              {geo.loading && <span className="text-[#64748B] ml-1">(detecting location...)</span>}
            </p>
          )}
          {geo.loading && !geo.position && (
            <p className="text-caption text-[#64748B] mt-1 animate-pulse">Detecting your location...</p>
          )}
          {geo.error && filters.location === "All" && (
            <p className="text-caption text-amber-400 mt-1">Enable location to see experiences near you</p>
          )}
        </div>

        <div className="relative mb-6 max-w-xl">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, location, category..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-[#1A2332] border border-white/[0.08] text-[#F1F5F9] text-body placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#FF2D7A] focus:ring-1 focus:ring-[#FF2D7A]/30 transition-all shadow-xs"
          />
          {filters.search && (
            <button onClick={() => updateFilter("search", "")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-text-secondary text-sm">
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter("category", cat)}
              className={`px-4 py-2 rounded-full text-body-sm font-medium whitespace-nowrap transition-all duration-200 ${
                filters.category === cat
                  ? "bg-[#FF2D7A] text-white shadow-sm shadow-[#FF2D7A]/20"
                  : "bg-[#1A2332] text-[#CBD5E1] border border-white/[0.08] hover:bg-white/[0.05] hover:text-[#F1F5F9] hover:border-[#FF2D7A]/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mb-8">
          {MOOD_LABELS.map((mood) => (
            <button
              key={mood.label}
              onClick={() => updateFilter("mood", filters.mood === mood.label ? null : mood.label)}
              className={`px-3 py-1.5 rounded-full text-caption font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                filters.mood === mood.label
                  ? "bg-[#FF2D7A] text-white shadow-sm shadow-[#FF2D7A]/20"
                  : "bg-[#1A2332] text-[#CBD5E1] border border-white/[0.08] hover:bg-white/[0.05] hover:text-[#F1F5F9] hover:border-[#FF2D7A]/30"
              }`}
            >
              <span>{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}

          <span className="text-[#64748B] text-caption hidden sm:inline select-none">|</span>

          {PRICE_RANGES.map((pr) => (
            <button
              key={pr.value}
              onClick={() => updateFilter("price", pr.value)}
              className={`px-3 py-1.5 rounded-full text-caption font-medium whitespace-nowrap transition-all duration-200 ${
                filters.price === pr.value
                  ? "bg-[#FF2D7A] text-white shadow-sm shadow-[#FF2D7A]/20"
                  : "bg-[#1A2332] text-[#CBD5E1] border border-white/[0.08] hover:bg-white/[0.05] hover:text-[#F1F5F9] hover:border-[#FF2D7A]/30"
              }`}
            >
              {pr.label}
            </button>
          ))}

          <span className="text-[#64748B] text-caption hidden sm:inline select-none">|</span>

          <select
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
            className="px-3 py-1.5 rounded-full text-caption font-medium bg-[#1A2332] text-[#CBD5E1] border border-white/[0.08] focus:outline-none focus:border-[#FF2D7A]/50 appearance-none cursor-pointer hover:bg-white/[0.05] transition-colors"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === "All" ? "All Locations" : loc}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              if (!filters.nearby && !geo.position && !geo.loading) {
                geo.requestPosition();
              }
              updateFilter("nearby", !filters.nearby);
            }}
            className={`px-3 py-1.5 rounded-full text-caption font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
              filters.nearby
                ? "bg-[#FF2D7A] text-white shadow-sm shadow-[#FF2D7A]/20"
                : "bg-[#1A2332] text-[#CBD5E1] border border-white/[0.08] hover:bg-white/[0.05] hover:text-[#F1F5F9] hover:border-[#FF2D7A]/30"
            }`}
          >
            <svg className={`w-3.5 h-3.5 ${geo.loading ? "animate-pulse" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {geo.loading ? "Locating..." : geo.position && filters.nearby ? "📍 Near You" : "Nearby"}
          </button>
        </div>

        {visibleExperiences.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-caption text-[#CBD5E1]">
                Showing {visibleExperiences.length} of {filtered.length} experience{filtered.length !== 1 ? "s" : ""}
              </p>
              {filters.search && (
                <p className="text-caption text-[#FF2D7A] font-medium">
                  Results for &ldquo;{filters.search}&rdquo;
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visibleExperiences.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} size="sm" />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#FF2D7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-heading-md font-bold text-[#F1F5F9] mb-2">No experiences found</p>
            <p className="text-body text-[#CBD5E1] mb-6">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 rounded-full bg-[#FF2D7A] text-white text-body-sm font-semibold shadow-[0_4px_16px_rgba(255,45,122,0.2)] hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300"
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
    </div>
  );
}
