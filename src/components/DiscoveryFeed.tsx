"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { experiences as mockExperiences } from "@/lib/data";
import { Experience } from "@/lib/types";

function loadSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("momento-saved");
    if (!raw) return [];
    const state = JSON.parse(raw);
    return state.savedIds || [];
  } catch { return []; }
}

function toggleSave(id: string, currentSaved: string[]): string[] {
  const next = currentSaved.includes(id)
    ? currentSaved.filter((s) => s !== id)
    : [...currentSaved, id];
  try {
    const raw = localStorage.getItem("momento-saved");
    const state = raw ? JSON.parse(raw) : { savedIds: [], collections: [] };
    state.savedIds = next;
    localStorage.setItem("momento-saved", JSON.stringify(state));
  } catch (e) { console.warn("Failed to save toggle state:", e); }
  return next;
}

export default function DiscoveryFeed() {
  const [items, setItems] = useState<Experience[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedIds(loadSaved());
  }, []);

  useEffect(() => {
    getExperiences({ limit: 20 })
      .then((res) => {
        const mapped = (res.experiences as Record<string, unknown>[]).map(transformExperience);
        setItems(mapped.length > 0 ? mapped.sort(() => Math.random() - 0.5) : [...mockExperiences].sort(() => Math.random() - 0.5));
      })
      .catch(() => {
        setItems([...mockExperiences].sort(() => Math.random() - 0.5));
      });
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    setCurrentIndex(index);
  }, []);

  const current = items[currentIndex] || items[0];

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="discovery-feed"
    >
      {items.map((exp, i) => {
        const isActive = i === currentIndex;
        const saved = savedIds.includes(exp.id);

        return (
          <div key={exp.id} className="discovery-feed-item">
            <div className="relative w-full h-full">
              <Image
                src={exp.image}
                alt={exp.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority={i < 3}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/30 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md text-white/90 text-caption font-medium border border-white/[0.08]">
                    {exp.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md text-white/90 text-caption font-medium border border-white/[0.08]">
                    {exp.duration}
                  </span>
                </div>

                <h2 className="text-display-sm sm:text-display-md font-bold text-white mb-1 leading-tight">
                  {exp.title}
                </h2>
                <p className="text-white/70 text-body-lg sm:text-heading-md mb-3">{exp.subtitle}</p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-400 text-body-sm font-medium">★</span>
                    <span className="text-white/80 text-body-sm font-medium">{exp.rating}</span>
                  </div>
                  <span className="text-white/50">Â·</span>
                  <span className="text-white/60 text-body-sm">{exp.location}</span>
                  <span className="text-white/50">Â·</span>
                  <span className="text-white font-semibold text-heading-sm">MK {exp.price.toLocaleString()}</span>
                </div>

                <p className="text-white/60 text-body-sm mb-5 line-clamp-2 leading-relaxed">{exp.description}</p>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/experiences/${exp.id}`}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FFA22C] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.35)] transition-all"
                  >
                    View Experience
                  </Link>
                  <button
                    onClick={() => setSavedIds(toggleSave(exp.id, savedIds))}
                    className={`px-4 py-2.5 rounded-xl border transition-all text-body-sm font-medium ${
                      saved
                        ? "border-[#FF0F73] text-[#FF0F73] bg-[#FF0F73]/10"
                        : "border-white/[0.15] text-white/80 hover:bg-white/[0.06]"
                    }`}
                  >
                    {saved ? "♥ Saved" : "♡ Save"}
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: exp.title, url: `${window.location.origin}/experiences/${exp.id}` }).catch((err) => console.warn("Share failed:", err));
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-white/[0.15] text-white/80 text-body-sm font-medium hover:bg-white/[0.06] transition-all"
                  >
                    Share
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="absolute top-20 left-0 right-0 flex gap-1 px-4 z-10">
                {items.slice(0, Math.min(items.length, 8)).map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
                      idx === i ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
