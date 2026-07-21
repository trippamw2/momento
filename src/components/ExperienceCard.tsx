"use client";

import Image from "next/image";
import Link from "next/link";
import { Experience, Intention } from "@/lib/types";
import { INTENTION_EMOJI, INTENTION_LABEL } from "@/lib/types";
import { getIntentionCta } from "@/lib/intentions";
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
    const raw = localStorage.getItem("experio-saved");
    if (!raw) return [];
    const state = JSON.parse(raw);
    return state.savedIds || [];
  } catch {
    return [];
  }
}

// Get primary intention for the experience
function getPrimaryIntention(exp: Experience): Intention | null {
  return exp.intentions?.[0] ?? null;
}

// Get CTA text based on primary intention
function getCtaText(exp: Experience): string {
  const primary = getPrimaryIntention(exp);
  return primary ? getIntentionCta(primary) : "Let's Go";
}

// Intention badge component
function IntentionBadge({ intention }: { intention: Intention }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-medium text-white/80 border border-white/10">
      <span>{INTENTION_EMOJI[intention]}</span>
      <span>{INTENTION_LABEL[intention]}</span>
    </span>
  );
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
  const primaryIntention = getPrimaryIntention(exp);

  const toggleSave = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const current = loadSaved();
      const next = saved
        ? current.filter((id: string) => id !== exp.id)
        : [...current, exp.id];
      try {
        const raw = localStorage.getItem("experio-saved");
        const state = raw
          ? JSON.parse(raw)
          : { savedIds: [], collections: [] };
        state.savedIds = next;
        localStorage.setItem("experio-saved", JSON.stringify(state));
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
      className={`${width} flex-shrink-0 snap-start group cursor-pointer`}
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#0a0a0a] transition-all duration-500 group-hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)] group-hover:scale-[1.02]">
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

        {/* Subtle gradient overlay for save button readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

        {/* Hover ring */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ring-1 ring-white/20" />

        {/* Intention badge - top left */}
        {primaryIntention && (
          <div className="absolute top-3 left-3 z-10">
            <IntentionBadge intention={primaryIntention} />
          </div>
        )}

        {/* Save button */}
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
      </div>

      {/* Info below image — photo-dominant, no overlay */}
      <div className="mt-2.5 px-0.5">
        {/* Emotional headline */}
        {exp.emotionalHeadline && (
          <p className="text-[11px] text-[#FF0F73]/80 font-medium italic line-clamp-1 mb-0.5">
            &ldquo;{exp.emotionalHeadline}&rdquo;
          </p>
        )}

        <h3 className="text-[#F1F5F9] font-semibold text-body-sm leading-snug line-clamp-1">
          {exp.title}
        </h3>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[#64748B] text-caption truncate">
            {exp.location}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-white font-semibold text-body-sm">
            MK {exp.price.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-caption text-[#CBD5E1]">
            <span className="text-yellow-400/80">&#9733;</span>
            {exp.rating}
          </span>
        </div>

        {/* CTA button */}
        <div className="mt-2">
          <span className="inline-flex items-center justify-center w-full py-2 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white text-xs font-semibold transition-all duration-300 group-hover:shadow-[0_0_16px_rgba(255,15,115,0.4)]">
            {getCtaText(exp)}
          </span>
        </div>
      </div>
    </Link>
  );
}
