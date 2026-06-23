"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { Mood, PRICE_RANGES, Experience } from "@/lib/types";
import { experiences as mockExperiences } from "@/lib/data";

const ITEMS_PER_PAGE = 8;
const LOAD_MORE = 4;

const MOOD_LABELS: { label: Mood; description: string; emoji: string; accent: string }[] = [
  { label: "Romantic", description: "Perfect for two", emoji: "🌹", accent: "from-rose-500 to-pink-500" },
  { label: "Relax", description: "Unwind and recharge", emoji: "🌊", accent: "from-emerald-500 to-teal-500" },
  { label: "Celebrate", description: "Make it special", emoji: "🥂", accent: "from-amber-500 to-orange-500" },
  { label: "Escape", description: "Get away from it all", emoji: "🌴", accent: "from-cyan-500 to-sky-500" },
  { label: "Indulge", description: "You deserve it", emoji: "✨", accent: "from-fuchsia-500 to-purple-500" },
  { label: "Food & Drink", description: "Culinary delights", emoji: "🍽️", accent: "from-amber-600 to-orange-600" },
  { label: "Family", description: "Fun for everyone", emoji: "👨‍👩‍👧‍👦", accent: "from-indigo-500 to-blue-500" },
  { label: "Entertainment", description: "Live your vibe", emoji: "🎭", accent: "from-violet-500 to-purple-500" },
  { label: "Adventure", description: "Thrill & excitement", emoji: "🧗", accent: "from-red-500 to-rose-500" },
  { label: "Self Care", description: "Nurture yourself", emoji: "🌿", accent: "from-green-500 to-emerald-500" },
  { label: "Social", description: "Connect with others", emoji: "💬", accent: "from-pink-500 to-rose-500" },
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
      }),
    [allExperiences, filters]
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
    <div className="pt-20 pb-16 bg-ambient-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <h1 className="text-display-sm font-bold text-[#222222] mb-1">
            All <span className="bg-gradient-to-r from-[#ff385c] to-[#FF7A18] bg-clip-text text-transparent">Experiences</span>
          </h1>
          <p className="text-[#6a6a6a] text-body-lg">{filtered.length} moments to discover</p>
        </div>

        <div className="relative mb-6 max-w-xl">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary"
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
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-surface-primary border border-border-default text-text-primary text-body placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink/30 transition-all shadow-xs"
          />
          {filters.search && (
            <button onClick={() => updateFilter("search", "")} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary text-sm">
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
                  ? "bg-gradient-to-r from-[#ff385c] to-[#FF7A18] text-white shadow-sm shadow-[#ff385c]/20"
                  : "bg-[#FFF8F0] text-[#6a6a6a] border border-[#ebebeb] hover:bg-[#FFF0F3] hover:text-[#222222] hover:border-[#ff385c]/30"
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
                  ? "bg-gradient-to-r from-[#ff385c] to-[#FF7A18] text-white shadow-sm shadow-[#ff385c]/20"
                  : "bg-[#FFF8F0] text-[#6a6a6a] border border-[#ebebeb] hover:bg-[#FFF0F3] hover:text-[#222222] hover:border-[#ff385c]/30"
              }`}
            >
              <span>{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}

          <span className="text-text-tertiary text-caption hidden sm:inline select-none">|</span>

          {PRICE_RANGES.map((pr) => (
            <button
              key={pr.value}
              onClick={() => updateFilter("price", pr.value)}
              className={`px-3 py-1.5 rounded-full text-caption font-medium whitespace-nowrap transition-all duration-200 ${
                filters.price === pr.value
                  ? "bg-gradient-to-r from-[#ff385c] to-[#FF7A18] text-white shadow-sm shadow-[#ff385c]/20"
                  : "bg-[#FFF8F0] text-[#6a6a6a] border border-[#ebebeb] hover:bg-[#FFF0F3] hover:text-[#222222] hover:border-[#ff385c]/30"
              }`}
            >
              {pr.label}
            </button>
          ))}

          <span className="text-text-tertiary text-caption hidden sm:inline select-none">|</span>

          <select
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
            className="px-3 py-1.5 rounded-full text-caption font-medium bg-[#FFF8F0] text-[#6a6a6a] border border-[#ebebeb] focus:outline-none focus:border-[#ff385c]/50 appearance-none cursor-pointer hover:bg-[#FFF0F3] transition-colors"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === "All" ? "All Locations" : loc}
              </option>
            ))}
          </select>

          <button
            onClick={() => updateFilter("nearby", !filters.nearby)}
            className={`px-3 py-1.5 rounded-full text-caption font-medium whitespace-nowrap transition-all duration-200 ${
              filters.nearby
                ? "bg-gradient-to-r from-[#ff385c] to-[#FF7A18] text-white shadow-sm shadow-[#ff385c]/20"
                : "bg-[#FFF8F0] text-[#6a6a6a] border border-[#ebebeb] hover:bg-[#FFF0F3] hover:text-[#222222] hover:border-[#ff385c]/30"
            }`}
          >
            Nearby
          </button>
        </div>

        {visibleExperiences.length > 0 ? (
          <>
            <p className="text-caption text-text-tertiary mb-4">
              Showing {visibleExperiences.length} of {filtered.length} experience{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {visibleExperiences.map((exp) => (
                <Link key={exp.id} href={`/experiences/${exp.id}`} className="group relative">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-tertiary card-hover">
                    <Image
                      src={exp.image}
                      alt={exp.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="gradient-overlay-bottom absolute inset-0" />
                    <div className="absolute top-2 left-2">
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 backdrop-blur-md text-white/90 border border-white/10">
                        {exp.distance ? exp.distance : exp.city}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const savedIds = JSON.parse(localStorage.getItem("momento-saved") || '{"savedIds":[],"collections":[]}').savedIds || [];
                        const next = savedIds.includes(exp.id) ? savedIds.filter((id: string) => id !== exp.id) : [...savedIds, exp.id];
                        const state = JSON.parse(localStorage.getItem("momento-saved") || '{"savedIds":[],"collections":[]}');
                        state.savedIds = next;
                        localStorage.setItem("momento-saved", JSON.stringify(state));
                        window.dispatchEvent(new Event("storage"));
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-brand-pink/80"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-yellow-400 text-[10px]">★</span>
                        <span className="text-caption text-white/80 font-medium">{exp.rating}</span>
                      </div>
                      <h3 className="text-white font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
                      <p className="text-white/60 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
                      <p className="text-white font-semibold text-body-sm mt-1">
                        MK {exp.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-heading-md text-text-tertiary mb-2">No experiences found</p>
            <p className="text-body text-text-secondary">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="mt-6 px-6 py-2.5 rounded-full gradient-brand text-text-on-gradient text-body-sm font-medium hover:shadow-brand-glow transition-all duration-300"
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
          <p className="text-center text-caption text-text-tertiary py-8">
            You&apos;ve seen them all
          </p>
        )}
      </div>
    </div>
  );
}
