"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Mood, MediaType, Experience } from "@/lib/types";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { experiences as mockExperiences } from "@/lib/data";
import { getPersonalizedRails } from "@/lib/recommendation-engine";
import { getTrending } from "@/lib/recommendation-engine";
import DiscoveryFeedItem from "@/components/DiscoveryFeedItem";
import { trackRecentlyViewed } from "@/lib/recently-viewed";

type ContentFilter = 
  | "all" 
  | "nearMe" 
  | "trending" 
  | "popular" 
  | "weekend" 
  | "date" 
  | "chill" 
  | "celebrate" 
  | "escape" 
  | "new" 
  | "hidden" 
  | "free" 
  | "luxury" 
  | "adventure" 
  | "food" 
  | "nature" 
  | "nightlife" 
  | "family" 
  | "friends" 
  | "romantic" 
  | "creators" 
  | "events" 
  | "culinary"
  | "creative"
  | "social";

type MoodOption = 
  | "happy" 
  | "romantic" 
  | "relaxed" 
  | "adventurous" 
  | "hungry" 
  | "creative" 
  | "social" 
  | "familyTime" 
  | "weekendEscape";

interface MoodConfig {
  id: MoodOption;
  label: string;
  emoji: string;
  filters: ContentFilter[];
}

const MOOD_CONFIGS: MoodConfig[] = [
  { id: "happy", label: "Happy", emoji: "😊", filters: ["popular", "chill", "celebrate"] },
  { id: "romantic", label: "Romantic", emoji: "❤️", filters: ["date", "romantic", "escape"] },
  { id: "relaxed", label: "Relaxed", emoji: "🧘", filters: ["chill", "nature", "escape"] },
  { id: "adventurous", label: "Adventurous", emoji: "🏔️", filters: ["adventure", "nature", "hidden"] },
  { id: "hungry", label: "Hungry", emoji: "🍽️", filters: ["food", "culinary", "date"] },
  { id: "creative", label: "Creative", emoji: "🎨", filters: ["creative", "creators", "events"] },
  { id: "social", label: "Social", emoji: "👥", filters: ["friends", "social", "nightlife"] },
  { id: "familyTime", label: "Family Time", emoji: "👨‍👩‍👧‍👦", filters: ["family", "events", "weekend"] },
  { id: "weekendEscape", label: "Weekend Escape", emoji: "🏝️", filters: ["weekend", "escape", "luxury"] },
];

const FILTER_CONFIGS: { id: ContentFilter; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "🔍" },
  { id: "nearMe", label: "Near Me", icon: "📍" },
  { id: "trending", label: "Trending", icon: "🔥" },
  { id: "popular", label: "Popular Today", icon: "⭐" },
  { id: "weekend", label: "Weekend Ideas", icon: "📅" },
  { id: "date", label: "Date", icon: "💑" },
  { id: "chill", label: "Chill", icon: "🧘" },
  { id: "celebrate", label: "Celebrate", icon: "🎉" },
  { id: "escape", label: "Escape", icon: "🏝️" },
  { id: "new", label: "New", icon: "✨" },
  { id: "hidden", label: "Hidden Gems", icon: "💎" },
  { id: "free", label: "Free", icon: "🆓" },
  { id: "luxury", label: "Luxury", icon: "💎" },
  { id: "adventure", label: "Adventure", icon: "🏔️" },
  { id: "food", label: "Food", icon: "🍽️" },
  { id: "nature", label: "Nature", icon: "🌲" },
  { id: "nightlife", label: "Nightlife", icon: "🌙" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { id: "friends", label: "Friends", icon: "👯" },
  { id: "romantic", label: "Romantic", icon: "💕" },
  { id: "creators", label: "Creators", icon: "🎥" },
  { id: "events", label: "Events", icon: "🎪" },
];

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

function loadMood(): MoodOption | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("experio-selected-mood") as MoodOption | null;
}

function saveMood(mood: MoodOption) {
  if (typeof window !== "undefined") {
    localStorage.setItem("experio-selected-mood", mood);
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
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(loadMood());
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2000);
  }, []);

  // Load experiences
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

  // Load more experiences
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

  // Load saved state
  useEffect(() => {
    setSavedIds(loadSaved());
  }, []);

  // Setup intersection observer for virtual scrolling
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

  // Load more trigger
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

  // Request geolocation when Near Me toggled on
  useEffect(() => {
    if (nearMe && !userLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setNearMe(false),
        { timeout: 10000 }
      );
    }
  }, [nearMe, userLocation]);

  // Filter experiences based on active filter and mood
  const filteredExperiences = useMemo(() => {
    let list = experiences;

    // Apply content filter
    if (activeFilter !== "all") {
      list = list.filter((exp) => {
        switch (activeFilter) {
          case "nearMe":
            return nearMe && userLocation && exp.coordinates ? 
              haversineDistance(userLocation, exp.coordinates) < 15 : false;
          case "trending":
            return exp.featured || exp.rating >= 4.7;
          case "popular":
            return exp.reviewCount >= 50 && exp.rating >= 4.5;
          case "weekend":
            return exp.category === "Escape" || exp.category === "Celebrate";
          case "date":
            return exp.category === "Date" || exp.mood.includes("Romantic");
          case "chill":
            return exp.category === "Chill" || exp.mood.includes("Relaxed");
          case "celebrate":
            return exp.category === "Celebrate" || exp.mood.includes("Celebratory");
          case "escape":
            return exp.category === "Escape";
          case "new":
            return exp.featured;
          case "hidden":
            return exp.rating >= 4.5 && exp.reviewCount < 20;
          case "free":
            return exp.price === 0;
          case "luxury":
            return exp.price >= 100000;
          case "adventure":
            return exp.category === "Escape" || exp.mood.includes("Active");
          case "food":
            return exp.mood.includes("Culinary");
          case "nature":
            return exp.mood.includes("Active") || exp.category === "Escape";
          case "nightlife":
            return exp.category === "Celebrate" && exp.bestTimeToVisit?.includes("evening");
          case "family":
            return exp.capacity >= 4;
          case "friends":
            return exp.capacity >= 4 && (exp.category === "Celebrate" || exp.mood.includes("Social"));
          case "romantic":
            return exp.category === "Date" || exp.mood.includes("Romantic");
          case "creators":
            return exp.ugc && exp.ugc.length > 0;
          case "events":
            return exp.bestTimeToVisit?.includes("event") || exp.featured;
          default:
            return true;
        }
      });
    }

    // Apply mood filter
    if (selectedMood) {
      const moodConfig = MOOD_CONFIGS.find(m => m.id === selectedMood);
      if (moodConfig) {
        list = list.filter((exp) => 
          moodConfig.filters.some(f => 
            f === "all" || 
            (f === "date" && exp.category === "Date") ||
            (f === "chill" && exp.category === "Chill") ||
            (f === "celebrate" && exp.category === "Celebrate") ||
            (f === "escape" && exp.category === "Escape") ||
            (f === "romantic" && exp.category === "Date") ||
            (f === "adventure" && (exp.category === "Escape" || exp.mood.includes("Active"))) ||
            (f === "food" && exp.mood.includes("Culinary")) ||
            (f === "nature" && (exp.mood.includes("Active") || exp.category === "Escape")) ||
            (f === "nightlife" && exp.category === "Celebrate") ||
            (f === "family" && exp.capacity >= 4) ||
            (f === "friends" && exp.capacity >= 4) ||
            (f === "romantic" && (exp.category === "Date" || exp.mood.includes("Romantic"))) ||
            (f === "creators" && exp.ugc && exp.ugc.length > 0) ||
            (f === "events" && (exp.featured || exp.bestTimeToVisit?.includes("event"))) ||
            (f === "weekend" && (exp.category === "Escape" || exp.category === "Celebrate")) ||
            (f === "luxury" && exp.price >= 100000) ||
            (f === "free" && exp.price === 0) ||
            (f === "hidden" && exp.rating >= 4.5 && exp.reviewCount < 20) ||
            (f === "new" && exp.featured) ||
            (f === "popular" && exp.reviewCount >= 50 && exp.rating >= 4.5) ||
            (f === "trending" && (exp.featured || exp.rating >= 4.7)) ||
            (f === "weekend" && (exp.category === "Escape" || exp.category === "Celebrate")) ||
            (f === "hidden" && exp.rating >= 4.5 && exp.reviewCount < 20) ||
            (f === "adventure" && (exp.category === "Escape" || exp.mood.includes("Active")))
          )
        );
      }
    }

    return list;
  }, [experiences, activeFilter, nearMe, userLocation, selectedMood]);

  const displayExperiences = useMemo(() => {
    if (experiences.length === 0) return [];
    return filteredExperiences.slice(0, page * 20);
  }, [filteredExperiences, page, experiences.length]);

  // Keyboard navigation
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

  // Haversine distance helper
  function haversineDistance(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const aVal = 
      Math.sin(dLat / 2) ** 2 + 
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * 
      Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(aVal));
  }

  const handleSaveToggle = useCallback(
    (id: string, next: boolean) => {
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
      showToast(next ? "Saved to your list!" : "Removed from your list");
    },
    [showToast]
  );

  const handleBook = useCallback(
    (id: string) => {
      trackRecentlyViewed(id);
      showToast("Opening booking...");
      setTimeout(() => router.push(`/experiences/${id}`), 300);
    },
    [router, showToast]
  );

  const handleMoodSelect = useCallback((mood: MoodOption) => {
    setSelectedMood(mood);
    saveMood(mood);
    setShowMoodPicker(false);
    setActiveFilter("all"); // Reset filter when mood changes
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#05070B] flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#FF0F73] border-t-transparent animate-spin" />
          <p className="text-[#CBD5E1] text-body-sm animate-pulse">Curating your feed...</p>
        </div>
      </div>
    );
  }

  if (displayExperiences.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#05070B] flex items-center justify-center z-50">
        <div className="text-center px-4">
          <h2 className="text-heading-lg font-bold text-white mb-2">No experiences yet</h2>
          <p className="text-[#CBD5E1] text-body-sm mb-6">Check back soon for new discoveries.</p>
          <a
            href="/experiences"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_20px_rgba(255, 15, 115, 0.3)] transition-all"
          >
            Browse Experiences
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="fixed inset-0 bg-[#05070B] overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        style={{ scrollBehavior: "smooth", scrollPaddingTop: "72px" }}
      >
      {/* Spacer so first item content isn't hidden behind fixed header */}
      <div className="snap-none h-16 sm:h-18" />

      {/* Mood Picker Trigger */}
      <button
        onClick={() => setShowMoodPicker(true)}
        className="snap-none fixed top-[80px] left-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white text-caption font-medium hover:bg-white/10 transition-all shadow-lg"
        aria-label="Choose your mood"
      >
        <span className="text-lg">{selectedMood ? MOOD_CONFIGS.find(m => m.id === selectedMood)?.emoji : "😊"}</span>
        <span>{selectedMood ? MOOD_CONFIGS.find(m => m.id === selectedMood)?.label : "How do you feel?"}</span>
        <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {/* Quick Filters Bar */}
      <div className="snap-none fixed top-[136px] left-0 right-0 z-30 px-4 pb-4 overflow-x-auto hide-scrollbar -ml-4">
        <div className="flex gap-2 min-w-max pb-2">
          {FILTER_CONFIGS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#FF0F73]/20 border border-[#FF0F73]/40 text-[#FF0F73]"
                    : "bg-black/50 border border-white/15 text-white hover:bg-white/10"
                }`}
              >
                <span className="text-lg">{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="snap-none fixed top-[188px] left-0 right-0 z-30 px-4 py-2 bg-[#05070B]/95 backdrop-blur-md border-b border-white/[0.06]">
          <div className="relative max-w-md mx-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#1A2332] border border-white/[0.08] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#FF0F73]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white text-xs">
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Toggle */}
      <button
        onClick={() => setSearchOpen(!searchOpen)}
        className="snap-none fixed top-[96px] right-4 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/20 transition-all"
        aria-label="Search"
      >
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Near Me Toggle */}
      <button
        onClick={() => setNearMe((prev) => !prev)}
        className={`snap-none fixed top-[96px] right-16 z-30 h-9 px-3 rounded-full backdrop-blur-md border flex items-center justify-center gap-1.5 text-caption font-medium transition-all ${
          nearMe
            ? "bg-[#FF0F73]/20 border-[#FF0F73]/40 text-[#FF0F73]"
            : "bg-black/50 border-white/15 text-white hover:bg-white/20"
        }`}
        aria-label="Near Me"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Near Me
      </button>

      {/* Toast */}
      <div className={`snap-none fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}>
        <div className="px-4 py-2.5 rounded-full bg-[#111827] border border-white/[0.1] shadow-xl text-[#F1F5F9] text-body-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {toast.message}
        </div>
      </div>

      {/* Render displayed experiences with virtual scrolling capability */}
      <div className="flex flex-col items-center">
        {displayExperiences.map((exp, index) => (
          <div
            key={exp.id}
            ref={(el) => {
              if (el) {
                itemRefs.current[index] = el;
                if (observerRef.current) {
                  observerRef.current.observe(el);
                }
              }
            }}
            data-index={index}
            className="snap-start w-full h-[100dvh] relative"
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
        
        {/* Load more trigger */}
        <div
          ref={loadMoreRef}
          className="flex justify-center py-8 h-20"
        >
          {isLoadingMore && (
            <div className="flex items-center gap-3 text-[#CBD5E1] text-body-sm">
              <div className="w-6 h-6 rounded-full border-2 border-[#FF0F73] border-t-transparent animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
          {!hasMore && displayExperiences.length > 0 && (
            <div className="text-[#64748B] text-caption">
              You've seen it all! 🎉
            </div>
          )}
        </div>
      </div>

      {/* Mood Picker Modal */}
      {showMoodPicker && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowMoodPicker(false)}>
        <div
          className="w-full max-w-md rounded-3xl bg-[#111827] border border-white/[0.08] overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1.5 bg-gradient-to-r from-[#FF0F73] via-[#FFA22C] to-[#F82D7B]" />
          <div className="px-4 sm:p-7">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-heading-lg font-bold text-[#F1F5F9]">What do you feel like today?</h2>
              <button onClick={() => setShowMoodPicker(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#0A0E17] text-[#CBD5E1] transition-colors shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-caption text-[#CBD5E1] mb-6">Your mood shapes what you discover</p>
            <div className="grid grid-cols-3 gap-3">
              {MOOD_CONFIGS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all group ${
                    selectedMood === mood.id
                      ? "border-[#FF0F73] bg-[#FF0F73]/10"
                      : "border-white/[0.1] bg-[#1E293B] hover:border-[#FF0F73]/30"
                  }`}
                >
                  <span className="text-3xl block mb-1">{mood.emoji}</span>
                  <p className="text-body-sm font-semibold text-[#F1F5F9]">{mood.label}</p>
                </button>
              ))}
</div>
        </div>
      </div>
            </div>
          )}
        </div>
      </div>
    );
  }

