"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Experience, Intention } from "@/lib/types";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { trackRecentlyViewed } from "@/lib/recently-viewed";
import { INTENTIONS } from "@/lib/types";
import DiscoveryFeedItem from "@/components/DiscoveryFeedItem";

// ─── Intention-based sections ───

interface SectionDef {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  intention?: Intention;
}

// Map intentions to section definitions
const INTENTION_SECTIONS: SectionDef[] = INTENTIONS.map((i) => ({
  key: `intention-${i.key}`,
  label: `${i.emoji} ${i.label}`,
  subtitle: i.description,
  icon: i.emoji,
  intention: i.key,
}));

// Keep a trending section as well
const TRENDING_SECTION: SectionDef = {
  key: "trending",
  label: "🔥 Trending Now",
  subtitle: "What everyone's loving",
  icon: "fire",
};

const SECTION_SIZE = 6;

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

function SectionIcon({ icon }: { icon: string }) {
  // If it's an emoji (intention icons), render directly
  if (icon.length <= 4 && /\p{Emoji}/u.test(icon)) {
    return <span className="text-lg">{icon}</span>;
  }
  switch (icon) {
    case "✦":
      return (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l1.5 6.5L20 9l-5 4.5 1.5 7L12 16l-5.5 4.5L8 13.5 3 9l6.5-.5L12 2z" />
        </svg>
      );
    case "fire":
      return (
        <svg className="w-5 h-5 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9c0-3 2-6 4-8 0 0 1 3 1 5s-1 3-1 5c0 0 2-1 4-1 0 0-2 4-4 6s-4 2-4 2-4-1-6-3-2-4-2-4c2 0 4 1 4 1s-1-2-1-4 1-3 1-3c2 2 4 4 4 4z" />
        </svg>
      );
    case "pin":
      return (
        <svg className="w-5 h-5 text-[#FF7A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "gem":
      return (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 9h20M12 3v18" />
        </svg>
      );
    case "sun":
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
        </svg>
      );
    default:
      return <span className="text-3xl">{icon}</span>;
  }
}

function SectionHeader({ section }: { section: SectionDef }) {
  return (
    <div className="w-full px-4 py-5 flex items-center gap-4 border-b border-white/[0.04]">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
        <SectionIcon icon={section.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-bold text-white">{section.label}</h2>
        <p className="text-xs text-white/40">{section.subtitle}</p>
      </div>
      <div className="w-1 h-1 rounded-full bg-[#FF0F73]/60" />
    </div>
  );
}

// ─── Feed routing ───

type FeedEntry =
  | { type: "section"; section: SectionDef; key: string }
  | { type: "experience"; experience: Experience; index: number; key: string };

function buildFeedPlan(
  experiences: Experience[],
  nearMe: boolean,
  userLocation: { lat: number; lng: number } | null,
  savedIds: string[] = [],
  searchHistory: string[] = []
): FeedEntry[] {
  const plan: FeedEntry[] = [];
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

  // 1. Trending section first
  const trending = experiences.filter((e) => (e.bookedCount || 0) > 50 || e.rating >= 4.8);
  const trendExps = assign(trending, TRENDING_SECTION);
  if (trendExps.length > 0) {
    plan.push({ type: "section", section: TRENDING_SECTION, key: "s-trending" });
    trendExps.forEach((exp, i) => plan.push({ type: "experience", experience: exp, index: i, key: `trend-${exp.id}` }));
  }

  // 2. Intention-based curated sets (3-7 per intention)
  for (const intentionSection of INTENTION_SECTIONS) {
    const matching = experiences.filter((e) => e.intentions.includes(intentionSection.intention!));
    // Sort by rating then review count for best curation
    const sorted = [...matching].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    const curated = assign(sorted, intentionSection);
    // Show at least 3 if available, up to 7
    if (curated.length >= 3) {
      plan.push({ type: "section", section: intentionSection, key: `s-${intentionSection.key}` });
      curated.forEach((exp, i) => plan.push({ type: "experience", experience: exp, index: i, key: `${intentionSection.key}-${exp.id}` }));
    }
  }

  // 3. Remaining experiences (overflow)
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
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<Experience[]>([]);
  const [aiExplanation, setAiExplanation] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2000);
  }, []);

  // ─── Load experiences ───
  useEffect(() => {
    const loadExperiences = async () => {
      setLoading(true);
      try {
        const res = await getExperiences({ limit: 40, page: 1 });
        const mapped = (res.experiences as Record<string, unknown>[]).map(transformExperience);
        setExperiences(mapped);
        setHasMore(mapped.length >= 40);
      } catch {
        setExperiences([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    loadExperiences();
  }, []);

  // ─── Load more ───
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

  // Infinite scroll observer
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

  // ─── Load saved IDs ───
  useEffect(() => {
    setSavedIds(loadSaved());
  }, []);

  // ─── Load search history ───
  useEffect(() => {
    try {
      const raw = localStorage.getItem("experio-search-history");
      if (raw) {
        const history = JSON.parse(raw);
        if (Array.isArray(history)) {
          setSearchHistory(history.slice(0, 8));
        }
      }
    } catch {}
  }, []);

  // ─── Save search to history ───
  const saveSearchToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    setSearchHistory((prev) => {
      const updated = [query, ...prev.filter((q) => q !== query)].slice(0, 8);
      try {
        localStorage.setItem("experio-search-history", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // ─── Build feed plan ───
  const feedPlan = useMemo(
    () => buildFeedPlan(experiences, nearMe, userLocation, savedIds, searchHistory),
    [experiences, nearMe, userLocation, savedIds, searchHistory]
  );

  // ─── Handle save toggle ───
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

  // ─── Handle book ───
  const handleBook = useCallback((id: string) => {
    trackRecentlyViewed(id);
    showToast("Opening booking…");
    setTimeout(() => router.push(`/experiences/${id}`), 300);
  }, [router, showToast]);

  // ─── Load AI recommendations (async, inline in feed) ───
  useEffect(() => {
    const loadAI = async () => {
      try {
        const res = await fetch("/api/ai?query=" + encodeURIComponent("recommend something for me based on trending experiences"));
        const data = await res.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          setAiRecommendations(data.results);
          setAiExplanation(data.explanation || "");
        }
      } catch {
        // AI is optional
      }
    };
    loadAI();
  }, []);

  // ─── Inject AI recommendations into feed plan ───
  const feedWithAi = useMemo(() => {
    if (aiRecommendations.length === 0) return feedPlan;
    // Insert AI section after "For You" (first section) or at position 6
    const insertAt = feedPlan.findIndex((e) => e.type === "section" && e.key === "s-trending");
    const idx = insertAt >= 0 ? insertAt : Math.min(6, feedPlan.length);
    const result = [...feedPlan];
    const aiSection: SectionDef = {
      key: "ai-picks",
      label: "AI Picks",
      subtitle: aiExplanation || "Recommended for you",
      icon: "✦",
    };
    result.splice(idx, 0, { type: "section", section: aiSection, key: "s-ai" });
    aiRecommendations.forEach((exp, i) => {
      result.splice(idx + 1 + i, 0, { type: "experience", experience: exp, index: i, key: `ai-${exp.id}` });
    });
    return result;
  }, [feedPlan, aiRecommendations, aiExplanation]);

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
    <div className="min-h-screen bg-black">
      {/* ─── Header with inline search ─── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[64px] bg-black/95 backdrop-blur-lg border-b border-white/[0.04] flex items-center gap-2 px-3">
        <Link href="/discover" className="flex items-center gap-2 flex-shrink-0" aria-label="Momento Home">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
        </Link>

        {/* Inline search input */}
        <div className="flex-1 relative max-w-[240px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                saveSearchToHistory(searchQuery.trim());
                const q = searchQuery.toLowerCase();
                const match = experiences.find((exp) =>
                  exp.title.toLowerCase().includes(q) ||
                  exp.subtitle?.toLowerCase().includes(q) ||
                  exp.location.toLowerCase().includes(q)
                );
                if (match) {
                  const el = document.getElementById(`exp-${match.id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setSearchQuery("");
                } else {
                  showToast("No experiences found");
                }
              }
            }}
            className="w-full pl-9 pr-3 py-2 rounded-full bg-white/5 border border-white/5 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs leading-none">
              ✕
            </button>
          )}
        </div>

        {/* Near Me toggle */}
        <button
          onClick={() => {
            if (nearMe) { setNearMe(false); return; }
            if (!navigator.geolocation) { showToast("Location not available"); return; }
            navigator.geolocation.getCurrentPosition(
              (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setNearMe(true); },
              () => { showToast("Enable location access"); },
              { timeout: 10000, enableHighAccuracy: false }
            );
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
            nearMe ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60 hover:bg-white/5"
          }`}
          aria-label="Near Me"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Sign out placeholder shows nothing in feed */}
      </header>

      {/* ─── Scrollable Feed ─── */}
      <div className="pt-[64px]">
        {/* AI Recommendations inline section */}
        {aiRecommendations.length > 0 && (
          <div className="px-4 py-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-sm text-white/90 font-medium">Recommended for you</p>
            </div>
            {aiExplanation && <p className="text-xs text-white/50 mb-2">{aiExplanation}</p>}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {aiRecommendations.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => { trackRecentlyViewed(exp.id); router.push(`/experiences/${exp.id}`); }}
                  className="flex-shrink-0 w-32 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:bg-white/[0.06] transition-all"
                >
                  <div className="h-20 bg-gradient-to-br from-[#FF0F73]/20 to-[#FF7A1A]/20" />
                  <div className="p-2">
                    <p className="text-xs text-white/80 font-medium truncate">{exp.title}</p>
                    <p className="text-[10px] text-white/40 truncate">{exp.location}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feed entries */}
        {feedPlan.map((entry) => {
          if (entry.type === "section") {
            return <SectionHeader key={entry.key} section={entry.section} />;
          }
          return (
            <div key={entry.key} id={`exp-${entry.experience.id}`}>
              <DiscoveryFeedItem
                experience={entry.experience}
                isSaved={savedIds.includes(entry.experience.id)}
                onSaveToggle={handleSaveToggle}
                onBook={handleBook}
              />
            </div>
          );
        })}

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="flex justify-center items-center py-8 min-h-[72px]">
          {isLoadingMore && (
            <div className="flex items-center gap-3 text-white/60 text-sm">
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Loading more…</span>
            </div>
          )}
          {!hasMore && experiences.length > 0 && (
            <div className="text-white/30 text-xs py-4">You&apos;ve seen it all</div>
          )}
        </div>

        {/* Bottom spacer for mobile nav */}
        <div className="h-24" />
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
