"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mood, Experience } from "@/lib/types";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { experiences as mockExperiences } from "@/lib/data";
import { trackRecentlyViewed } from "@/lib/recently-viewed";
import DiscoveryFeedItem from "@/components/DiscoveryFeedItem";

type ContentFilter = "all" | "nearMe";

interface MoodOption {
  id: string;
  label: string;
  filters: ContentFilter[];
}

const MOOD_OPTIONS: MoodOption[] = [
  { id: "romantic", label: "Romantic", filters: ["all"] },
  { id: "relaxed", label: "Relaxed", filters: ["all"] },
  { id: "adventurous", label: "Adventurous", filters: ["all"] },
  { id: "culinary", label: "Culinary", filters: ["all"] },
  { id: "social", label: "Social", filters: ["all"] },
  { id: "creative", label: "Creative", filters: ["all"] },
  { id: "luxury", label: "Luxury", filters: ["all"] },
  { id: "family", label: "Family", filters: ["all"] },
];

function loadMood(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("experio-selected-mood");
}

function saveMood(mood: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("experio-selected-mood", mood);
  }
}

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
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(loadMood());
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
        const res = await getExperiences({ limit: 20, page: 1 });
        const mapped = (res.experiences as Record<string, unknown>[]).map(transformExperience);
        setExperiences(mapped.length > 0 ? mapped : mockExperiences);
        setHasMore(mapped.length >= 20);
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

  const filteredExperiences = useMemo(() => {
    let list = experiences;

    if (activeFilter === "nearMe") {
      list = list.filter((exp) => 
        nearMe && userLocation && exp.coordinates ? 
        haversineDistance(userLocation, exp.coordinates) < 15 : false
      );
    }

    return list;
  }, [experiences, activeFilter, nearMe, userLocation]);

  const displayExperiences = useMemo(() => {
    if (experiences.length === 0) return [];
    return filteredExperiences.slice(0, page * 20);
  }, [filteredExperiences, page, experiences.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const next = Math.max(0, Math.min(displayExperiences.length - 1, currentIndex + delta));
        container.scrollTo({ top: next * container.clientHeight, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, displayExperiences.length]);

  function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const aVal = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(aVal));
  }

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

  const handleMoodSelect = useCallback((mood: string) => {
    setSelectedMood(mood);
    saveMood(mood);
    setShowMoodPicker(false);
    setActiveFilter("all");
  }, []);

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

  if (displayExperiences.length === 0) {
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

  return (
    <div className="relative min-h-screen bg-black">
      {/* Header Bar - outside scroll container for reliable click handling */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[72px] bg-black/95 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/discover" className="flex items-center gap-2 flex-shrink-0" aria-label="Experio Home">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight hidden sm:block">Experio</span>
        </Link>

        <div className="flex items-center gap-2 flex-1 justify-center">
          <button
            onClick={() => setShowMoodPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white text-xs font-medium hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
            aria-label="Choose your mood"
          >
            <span className="text-base">✦</span>
            <span>{selectedMood ? selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1) : "Mood"}</span>
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-9 h-9 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Search"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <button
            onClick={() => setNearMe((prev) => !prev)}
            className={`h-9 px-3 rounded-full backdrop-blur-sm border flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
              nearMe
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            }`}
            aria-label="Near Me"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Near Me
          </button>
        </div>
      </header>

      {/* Search Bar - outside scroll container */}
      {searchOpen && (
        <div className="fixed top-[72px] left-0 right-0 z-30 px-4 py-2 bg-black/95 backdrop-blur-md border-b border-white/10">
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

      {/* Scroll container - feed only */}
      <div
        ref={containerRef}
        className="fixed inset-0 bg-black overflow-y-scroll snap-y snap-mandatory hide-scrollbar pt-[72px]"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex flex-col items-center">
          {displayExperiences.map((exp, index) => (
            <div
              key={exp.id}
              ref={(el) => {
                if (el) {
                  itemRefs.current[index] = el;
                  if (observerRef.current) observerRef.current.observe(el);
                }
              }}
              data-index={index}
              className="snap-start w-full h-[calc(100dvh-72px)] relative"
            >
              <DiscoveryFeedItem
                experience={exp}
                isActive={index === currentIndex}
                isSaved={savedIds.includes(exp.id)}
                onSaveToggle={handleSaveToggle}
                onBook={handleBook}
              />
            </div>
          ))}

          <div ref={loadMoreRef} className="flex justify-center py-8 h-20">
            {isLoadingMore && (
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Loading more…</span>
              </div>
            )}
            {!hasMore && displayExperiences.length > 0 && (
              <div className="text-white/40 text-xs">You've seen it all</div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <div className="px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl text-white text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toast.message}
        </div>
      </div>

      {/* Mood Picker Modal */}
      {showMoodPicker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowMoodPicker(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-black border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-white/20 via-white/10 to-white/20" />
            <div className="px-4 sm:p-7">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-white">How do you feel?</h2>
                <button onClick={() => setShowMoodPicker(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 text-white/60 transition-colors shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-white/50 mb-6">Your mood shapes what you discover</p>
              <div className="grid grid-cols-3 gap-3">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedMood === mood.id
                        ? "border-white/30 bg-white/5"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{mood.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}