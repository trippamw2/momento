"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Experience, Mood } from "@/lib/types";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { experiences as mockExperiences } from "@/lib/data";
import { getPersonalizedRails } from "@/lib/recommendation-engine";
import DiscoveryFeedItem from "@/components/DiscoveryFeedItem";
import { trackRecentlyViewed } from "@/lib/recently-viewed";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2000);
  }, []);

  // Load experiences
  useEffect(() => {
    getExperiences({ limit: 20 })
      .then((res) => {
        const mapped = (res.experiences as Record<string, unknown>[]).map(transformExperience);
        setExperiences(mapped.length > 0 ? mapped : mockExperiences);
      })
      .catch(() => setExperiences(mockExperiences))
      .finally(() => setLoading(false));
  }, []);

  // Load saved state
  useEffect(() => {
    setSavedIds(loadSaved());
  }, []);

  // Request geolocation when Near Me toggled on
  useEffect(() => {
    if (nearMe && !userLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setNearMe(false), // permission denied
        { timeout: 10000 }
      );
    }
  }, [nearMe, userLocation]);

  // Track scroll position to determine active item
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const index = Math.round(container.scrollTop / container.clientHeight);
      setCurrentIndex(Math.min(index, experiences.length - 1));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [experiences.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const next = Math.max(0, Math.min(experiences.length - 1, currentIndex + delta));
        container.scrollTo({ top: next * container.clientHeight, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, experiences.length]);

  const feedExperiences = useMemo(() => {
    let list = experiences;
    // Filter by proximity if Near Me is active
    if (nearMe && userLocation) {
      list = experiences.filter((exp) => {
        if (!exp.coordinates) return false;
        const R = 6371;
        const dLat = ((exp.coordinates.lat - userLocation.lat) * Math.PI) / 180;
        const dLng = ((exp.coordinates.lng - userLocation.lng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLocation.lat * Math.PI) / 180) * Math.cos((exp.coordinates.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a)) < 15;
      });
    }
    if (list.length === 0) return [];

    // Try personalized rails first
    const rails = getPersonalizedRails(list, userLocation ?? undefined);
    if (rails.length > 0) {
      const recommended = rails.find((r) => r.key === "recommended");
      if (recommended && recommended.experiences.length >= 5) {
        return recommended.experiences;
      }
    }

    // Fallback: sort by rating
    return [...list].sort((a, b) => b.rating - a.rating);
  }, [experiences, nearMe, userLocation]);

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

  if (feedExperiences.length === 0) {
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
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#05070B] overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      style={{ scrollBehavior: "smooth", scrollPaddingTop: "72px" }}
    >
      {/* Spacer so first item content isn't hidden behind fixed header */}
      <div className="snap-none h-16 sm:h-18" />

      {/* ─── Compact Search Bar ─── */}
      {searchOpen && (
        <div className="snap-none fixed top-16 left-0 right-0 z-30 px-4 py-2 bg-[#05070B]/95 backdrop-blur-md border-b border-white/[0.06]">
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
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white text-xs">✕</button>
            )}
          </div>
        </div>
      )}

      {/* ─── Search Toggle ─── */}
      <button
        onClick={() => setSearchOpen(!searchOpen)}
        className="snap-none fixed top-[18px] right-4 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/20 transition-all"
        aria-label="Search"
      >
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* ─── Near Me Toggle ─── */}
      <button
        onClick={() => setNearMe((prev) => !prev)}
        className={`snap-none fixed top-[18px] right-16 z-30 h-9 px-3 rounded-full backdrop-blur-md border flex items-center justify-center gap-1.5 text-caption font-medium transition-all ${
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

      {/* ─── Toast ─── */}
      <div className={`snap-none fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}>
        <div className="px-4 py-2.5 rounded-full bg-[#111827] border border-white/[0.1] shadow-xl text-[#F1F5F9] text-body-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {toast.message}
        </div>
      </div>

      {feedExperiences.map((exp, index) => (
        <div
          key={exp.id}
          ref={(el) => { itemRefs.current[index] = el; }}
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
    </div>
  );
}
