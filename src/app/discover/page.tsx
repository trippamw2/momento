"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Experience } from "@/lib/types";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { experiences as mockExperiences } from "@/lib/data";
import { trackRecentlyViewed } from "@/lib/recently-viewed";
import DiscoveryFeedItem from "@/components/DiscoveryFeedItem";

// ─── Smart Feed Section Labels ───

interface SectionDef {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
}

const SECTIONS: SectionDef[] = [
  { key: "for-you", label: "For You", subtitle: "Handpicked just for you", icon: "✦" },
  { key: "trending", label: "Trending", subtitle: "What everyone's loving", icon: "🔥" },
  { key: "nearby", label: "Nearby", subtitle: "Experiences close to you", icon: "📍" },
  { key: "hidden-gems", label: "Hidden Gems", subtitle: "Undiscovered treasures", icon: "💎" },
  { key: "weekend", label: "Weekend Ideas", subtitle: "Make the most of your weekend", icon: "🌤" },
];

// Each section gets roughly this many experience cards before the next section label
const SECTION_SIZE = 3;

// ─── Helpers ───

function loadSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("experio-saved");
    if (!raw) return [];
    const state = JSON.parse(raw);
    return state.savedIds || [];
  } catch {
    return [];
  }
}

function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const aVal = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(aVal));
}

// ─── Section Header Component ───

function SectionHeader({ section }: { section: SectionDef }) {
  return (
    <div className="snap-start w-full h-[calc(100dvh-72px)] relative flex items-center justify-center bg-black">
      <div className="text-center px-8">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">{section.icon}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
          {section.label}
        </h2>
        <p className="text-white/50 text-sm sm:text-base font-light">
          {section.subtitle}
        </p>
      </div>
    </div>
  );
}

// ─── Feed Item (section header OR experience card) ───

type FeedEntry =
  | { type: "section"; section: SectionDef; key: string }
  | { type: "experience"; experience: Experience; index: number; key: string };

function buildFeedPlan(
  experiences: Experience[],
  nearMe: boolean,
  userLocation: { lat: number; lng: number } | null
): FeedEntry[] {
  const plan: FeedEntry[] = [];

  // Categorize experiences by mood/features for smart sections
  const trending = experiences.filter((e) => (e.bookedCount || 0) > 50 || e.rating >= 4.8);
  const nearby = nearMe && userLocation
    ? experiences
        .filter((e) => e.coordinates && haversineDistance(userLocation, e.coordinates) < 15)
        .slice(0, SECTION_SIZE)
    : [];
  const gems = experiences.filter((e) => e.rating >= 4.5 && e.reviewCount < 80 && (e.bookedCount || 0) < 40);
  const weekend = experiences.filter((e) => e.duration && parseInt(e.duration) >= 3);

  // Track which experiences are already used to avoid duplicates
  const used = new Set<string>();

  function assign(list: Experience[], section: SectionDef): Experience[] {
    const assigned: Experience[] = [];
    for (const exp of list) {
      if (assigned.length >= SECTION_SIZE) break;
      if (!used.has(exp.id)) {
        used.add(exp.id);
        assigned.push(exp);
      }
    }
    return assigned;
  }

  // Build sections
  const forYou = assign(experiences, SECTIONS[0]);
  const trendExps = assign(trending, SECTIONS[1]);
  const nearbyExps = nearby.length > 0 ? assign(nearby, SECTIONS[2]) : [];
  const gemExps = assign(gems, SECTIONS[3]);
  const weekendExps = assign(weekend, SECTIONS[4]);

  // Add section headers + experiences (skip empty sections)
  if (forYou.length > 0) {
    plan.push({ type: "section", section: SECTIONS[0], key: "s-for-you" });
    forYou.forEach((exp, i) => plan.push({ type: "experience", experience: exp, index: i, key: `for-you-${exp.id}` }));
  }

  if (trendExps.length > 0) {
    plan.push({ type: "section", section: SECTIONS[1], key: "s-trending" });
    trendExps.forEach((exp, i) => plan.push({ type: "experience", experience: exp, index: i, key: `trend-${exp.id}` }));
  }

  if (nearbyExps.length > 0) {
    plan.push({ type: "section", section: SECTIONS[2], key: "s-nearby" });
    nearbyExps.forEach((exp, i) => plan.push({ type: "experience", experience: exp, index: i, key: `nearby-${exp.id}` }));
  }

  if (gemExps.length > 0) {
    plan.push({ type: "section", section: SECTIONS[3], key: "s-gems" });
    gemExps.forEach((exp, i) => plan.push({ type: "experience", experience: exp, index: i, key: `gem-${exp.id}` }));
  }

  if (weekendExps.length > 0) {
    plan.push({ type: "section", section: SECTIONS[4], key: "s-weekend" });
    weekendExps.forEach((exp, i) => plan.push({ type: "experience", experience: exp, index: i, key: `weekend-${exp.id}` }));
  }

  // Remaining experiences (not assigned to any section)
  const remaining = experiences.filter((e) => !used.has(e.id));
  if (remaining.length > 0) {
    remaining.forEach((exp, i) => plan.push({ type: "experience", experience: exp, index: i, key: `more-${exp.id}` }));
  }

  return plan;
}

// ─── Main Page ───

export default function DiscoverPage() {
  const router = useRouter();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2000);
  }, []);

  useEffect(() => {
    const loadExperiences = async () => {
      setLoading(true);
      try {
        const res = await getExperiences({ limit: 40, page: 1 });
        const mapped = (res.experiences as Record<string, unknown>[]).map(transformExperience);
        setExperiences(mapped.length > 0 ? mapped : mockExperiences);
        setHasMore(mapped.length >= 40);
      } catch {
        setExperiences(mockExperiences);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    loadExperiences();
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const res = await getExperiences({ limit: 20, page: page + 1 });
      const mapped = (res.experiences as Record<string, unknown>[]).map(transformExperience);
      if (mapped.length > 0) {
        setExperiences((prev) => [...prev, ...mapped]);
        setPage((prev) => prev + 1);
        setHasMore(mapped.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore]);

  useEffect(() => {
    setSavedIds(loadSaved());
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute("data-index") || "0", 10);
            setCurrentIndex(index);
          }
        });
      },
      { root: containerRef.current, rootMargin: "0px 0px -50% 0px", threshold: 0.5 }
    );

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoadingMore && hasMore) {
            loadMore();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMore, isLoadingMore, hasMore]);

  useEffect(() => {
    if (nearMe && !userLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setNearMe(false),
        { timeout: 10000 }
      );
    }
  }, [nearMe, userLocation]);

  // Build the smart feed plan — section headers + experience cards
  const feedPlan = useMemo(
    () => buildFeedPlan(experiences, nearMe, userLocation),
    [experiences, nearMe, userLocation]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const next = Math.max(0, Math.min(feedPlan.length - 1, currentIndex + delta));
        container.scrollTo({ top: next * container.clientHeight, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, feedPlan.length]);

  const handleSaveToggle = useCallback((id: string, next: boolean) => {
    setSavedIds((prev) => {
      const updated = next ? [...prev, id] : prev.filter((s) => s !== id);
      try {
        const raw = localStorage.getItem("experio-saved");
        const state = raw ? JSON.parse(raw) : { savedIds: [], collections: [] };
        state.savedIds = updated;
        localStorage.setItem("experio-saved", JSON.stringify(state));
      } catch {}
      return updated;
    });
    showToast(next ? "Saved to your list" : "Removed from your list");
  }, [showToast]);

  const handleBook = useCallback((id: string) => {
    trackRecentlyViewed(id);
    showToast("Opening booking…");
    setTimeout(() => router.push(`/experiences/${id}`), 300);
  }, [router, showToast]);

  // ─── Loading State ───

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-white/60 text-sm">Loading experiences…</p>
        </div>
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center px-4">
          <h2 className="text-2xl font-semibold text-white mb-2">No experiences yet</h2>
          <p className="text-white/60 text-sm mb-6">Check back soon for new discoveries.</p>
          <a href="/experiences" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all">
            Browse All Experiences
          </a>
        </div>
      </div>
    );
  }

  // ─── Render ───

  return (
    <div className="relative min-h-screen bg-black">
      {/* ─── Minimal Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[64px] bg-black/95 backdrop-blur-lg border-b border-white/[0.04] flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/discover" className="flex items-center gap-2 flex-shrink-0" aria-label="Experio Home">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center">
            <span className="text-white font-bold text-xs">E</span>
          </div>
        </Link>

        {/* Center: Search trigger */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex-1 max-w-[200px] mx-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-white/40 text-xs text-left hover:bg-white/10 hover:text-white/60 transition-all"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search experiences…</span>
        </button>

        {/* Right: Near Me */}
        <button
          onClick={() => setNearMe((prev) => !prev)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            nearMe
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60 hover:bg-white/5"
          }`}
          aria-label="Near Me"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* ─── Search Bar ─── */}
      {searchOpen && (
        <div className="fixed top-[64px] left-0 right-0 z-30 px-4 py-3 bg-black/95 backdrop-blur-md border-b border-white/[0.04]">
          <div className="relative max-w-md mx-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search experiences…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs">
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Scrollable Feed ─── */}
      <div
        ref={containerRef}
        className="fixed inset-0 bg-black overflow-y-scroll snap-y snap-mandatory hide-scrollbar pt-[64px]"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex flex-col items-center">
          {feedPlan.map((entry, i) => {
            if (entry.type === "section") {
              return <SectionHeader key={entry.key} section={entry.section} />;
            }

            return (
              <div
                key={entry.key}
                ref={(el) => {
                  if (el) {
                    itemRefs.current[i] = el;
                    if (observerRef.current) observerRef.current.observe(el);
                  }
                }}
                data-index={i}
                className="snap-start w-full h-[calc(100dvh-64px)] relative"
              >
                <DiscoveryFeedItem
                  experience={entry.experience}
                  isActive={i === currentIndex}
                  isSaved={savedIds.includes(entry.experience.id)}
                  onSaveToggle={handleSaveToggle}
                  onBook={handleBook}
                />
              </div>
            );
          })}

          <div ref={loadMoreRef} className="flex justify-center py-8 h-20">
            {isLoadingMore && (
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Loading more…</span>
              </div>
            )}
            {!hasMore && experiences.length > 0 && (
              <div className="text-white/30 text-xs py-4">You've seen it all</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Toast ─── */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <div className="px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl text-white text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toast.message}
        </div>
      </div>
    </div>
  );
}
