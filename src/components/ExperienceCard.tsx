"use client";

import Image from "next/image";
import Link from "next/link";
import { Experience } from "@/lib/types";
import { useState, useCallback } from "react";
import { trackView, trackSaved } from "@/lib/recommendation-engine";

interface ExperienceCardProps {
  experience: Experience;
  size?: "sm" | "md" | "lg";
  distance?: number;
}

function loadSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("momento-saved");
    if (!raw) return [];
    const state = JSON.parse(raw);
    return state.savedIds || [];
  } catch {
    return [];
  }
}

export default function ExperienceCard({
  experience: exp,
  size = "md",
  distance,
}: ExperienceCardProps) {
  const widthMap = {
    sm: "w-44 sm:w-52",
    md: "w-56 sm:w-64 md:w-72",
    lg: "w-72 sm:w-80",
  };
  const width = widthMap[size];
  const [saved, setSaved] = useState(() => loadSaved().includes(exp.id));
  const [imgLoaded, setImgLoaded] = useState(false);
  const primaryMood = exp.mood?.[0];

  const toggleSave = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const current = loadSaved();
      const next = saved
        ? current.filter((id: string) => id !== exp.id)
        : [...current, exp.id];
      try {
        const raw = localStorage.getItem("momento-saved");
        const state = raw
          ? JSON.parse(raw)
          : { savedIds: [], collections: [] };
        state.savedIds = next;
        localStorage.setItem("momento-saved", JSON.stringify(state));
      } catch (e) {
        console.warn("Failed to save toggle state:", e);
      }
      trackSaved(exp.id, !saved);
      setSaved(!saved);
    },
    [saved, exp.id],
  );

  return (
    <Link
      href={`/experiences/${exp.id}`}
      onClick={() => trackView(exp.id)}
      className={`${width} flex-shrink-0 snap-start group relative cursor-pointer`}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0a0a0a] transition-all duration-500 group-hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)] group-hover:scale-[1.02] group-hover:translate-y-[-3px] border border-white/[0.06]">
        {/* Image */}
        <Image
          src={exp.image}
          alt={exp.title}
          fill
          className={`object-cover transition-all duration-700 group-hover:scale-110 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          sizes="(max-width: 640px) 288px, 288px"
          onLoad={() => setImgLoaded(true)}
          priority={size === "lg"}
        />

        {/* Loading shimmer */}
        {!imgLoaded && <div className="absolute inset-0 shimmer" />}

        {/* Subtle gradient overlay at bottom only */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

        {/* Premium border glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ring-1 ring-white/20" />

        {/* Top: Save button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={toggleSave}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-300 hover:bg-[#FF0F73]/80 hover:scale-110 active:scale-90"
            aria-label={saved ? "Remove from saved" : "Save experience"}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={saved ? "#FF0F73" : "none"}
              stroke={saved ? "#FF0F73" : "white"}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Bottom content - minimal & airy */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          {primaryMood && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white/80 bg-white/10 backdrop-blur-sm border border-white/10 mb-2">
              {primaryMood}
            </span>
          )}

          <h3 className="text-white font-semibold text-body-sm leading-tight line-clamp-1 tracking-tight">
            {exp.title}
          </h3>

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-white/50 text-caption flex items-center gap-1 truncate">
              <svg
                className="w-3 h-3 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {exp.location}
            </span>
            {distance !== undefined && (
              <span className="text-white/40 text-[10px] whitespace-nowrap">
                {distance.toFixed(1)} km
              </span>
            )}
          </div>

          <div className="h-px bg-white/[0.06] my-2" />

          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-body-sm tracking-tight">
              MK {exp.price.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-caption text-white/50">
              <span className="text-yellow-400/80">&#9733;</span>
              {exp.rating}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
