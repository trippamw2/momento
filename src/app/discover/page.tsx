"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Experience } from "@/lib/types";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { experiences as mockExperiences } from "@/lib/data";
import { getPersonalizedRails } from "@/lib/recommendation-engine";
import DiscoveryFeedItem from "@/components/DiscoveryFeedItem";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    if (experiences.length === 0) return [];

    // Try personalized rails first
    const rails = getPersonalizedRails(experiences);
    if (rails.length > 0) {
      // Use the recommended rail as the primary feed
      const recommended = rails.find((r) => r.key === "recommended");
      if (recommended && recommended.experiences.length >= 5) {
        return recommended.experiences;
      }
    }

    // Fallback: sort by rating
    return [...experiences].sort((a, b) => b.rating - a.rating);
  }, [experiences]);

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
    },
    []
  );

  const handleBook = useCallback(
    (id: string) => {
      router.push(`/experiences/${id}`);
    },
    [router]
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#05070B] flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#FF2D7A] border-t-transparent animate-spin" />
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_20px_rgba(255,45,122,0.3)] transition-all"
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
