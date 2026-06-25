"use client";

import Image from "next/image";
import Link from "next/link";
import { Experience } from "@/lib/types";
import { useState, useCallback } from "react";
import { trackView, trackSaved } from "@/lib/recommendations";
import { trackBooked } from "@/lib/recommendation-engine";

const MOOD_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  Romantic: { bg: "from-rose-500 to-pink-500", text: "text-rose-300", glow: "rgba(244,63,94,0.3)" },
  Relax: { bg: "from-emerald-500 to-teal-500", text: "text-emerald-300", glow: "rgba(16,185,129,0.3)" },
  Celebrate: { bg: "from-amber-500 to-orange-500", text: "text-amber-300", glow: "rgba(245,158,11,0.3)" },
  Escape: { bg: "from-cyan-500 to-sky-500", text: "text-cyan-300", glow: "rgba(6,182,212,0.3)" },
  Indulge: { bg: "from-fuchsia-500 to-purple-500", text: "text-fuchsia-300", glow: "rgba(217,70,239,0.3)" },
  "Food & Drink": { bg: "from-amber-600 to-orange-600", text: "text-amber-300", glow: "rgba(234,88,12,0.3)" },
  Family: { bg: "from-indigo-500 to-blue-500", text: "text-indigo-300", glow: "rgba(99,102,241,0.3)" },
  Entertainment: { bg: "from-violet-500 to-purple-500", text: "text-violet-300", glow: "rgba(139,92,246,0.3)" },
  Adventure: { bg: "from-red-500 to-rose-500", text: "text-red-300", glow: "rgba(239,68,68,0.3)" },
  "Self Care": { bg: "from-green-500 to-emerald-500", text: "text-green-300", glow: "rgba(34,197,94,0.3)" },
  Social: { bg: "from-pink-500 to-rose-500", text: "text-pink-300", glow: "rgba(236,72,153,0.3)" },
};

interface ExperienceCardProps {
  experience: Experience;
  size?: "sm" | "md" | "lg";
}

function loadSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("experio-saved");
    if (!raw) return [];
    const state = JSON.parse(raw);
    return state.savedIds || [];
  } catch { return []; }
}

export default function ExperienceCard({ experience: exp, size = "md" }: ExperienceCardProps) {
  const widthMap = { sm: "w-44 sm:w-52", md: "w-56 sm:w-64 md:w-72", lg: "w-72 sm:w-80" };
  const width = widthMap[size];
  const [saved, setSaved] = useState(() => loadSaved().includes(exp.id));
  const [shareFeedback, setShareFeedback] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const primaryMood = exp.mood[0];
  const moodColor = MOOD_COLORS[primaryMood] || MOOD_COLORS.Social;

  const toggleSave = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = loadSaved();
    const next = saved ? current.filter((id: string) => id !== exp.id) : [...current, exp.id];
    try {
      const raw = localStorage.getItem("experio-saved");
      const state = raw ? JSON.parse(raw) : { savedIds: [], collections: [] };
      state.savedIds = next;
      localStorage.setItem("experio-saved", JSON.stringify(state));
    } catch {}
    trackSaved(exp.id, !saved);
    setSaved(!saved);
  }, [saved, exp.id]);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: exp.title, url: `${window.location.origin}/experiences/${exp.id}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/experiences/${exp.id}`).then(() => {
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      });
    }
  };

  return (
    <Link href={`/experiences/${exp.id}`} onClick={() => trackView(exp.id)} className={`${width} flex-shrink-0 snap-start group relative cursor-pointer`}>
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0a0a0a] transition-all duration-500 group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)] group-hover:scale-[1.02] group-hover:translate-y-[-2px] border border-white/[0.06]">
        {/* Cinematic image with grain overlay */}
        <Image
          src={exp.image}
          alt={exp.title}
          fill
          className={`object-cover transition-all duration-700 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          sizes="(max-width: 640px) 288px, 288px"
          onLoad={() => setImgLoaded(true)}
          priority={size === "lg"}
        />
        
        {/* Loading shimmer */}
        {!imgLoaded && (
          <div className="absolute inset-0 shimmer" />
        )}

        {/* Cinematic gradient overlay - darker at bottom for text, lighter vignette top */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
        
        {/* Subtle ambient glow based on mood */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(ellipse at 50% 80%, ${moodColor.glow} 0%, transparent 70%)` }}
        />

        {/* Premium border glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ring-1 ring-white/10" />

        {/* Top row: Mood + Save */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          <span className={`px-3 py-1.5 rounded-full text-caption font-semibold text-white bg-black/50 backdrop-blur-md border border-white/15 shadow-lg tracking-wide`}>
            {primaryMood}
          </span>
          <button
            onClick={toggleSave}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-300 hover:bg-[#FF2D7A]/80 hover:scale-110 active:scale-90"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "#FF2D7A" : "none"} stroke={saved ? "#FF2D7A" : "white"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          {/* Rating row */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-yellow-400 text-[11px]">★</span>
            <span className="text-caption text-white/90 font-semibold">{exp.rating}</span>
            <span className="text-caption text-white/30">·</span>
            <span className="text-caption text-white/60">{exp.reviewCount} reviews</span>
            <span className="text-caption text-white/30">·</span>
            <span className="text-caption text-white/60">{exp.location}</span>
          </div>
          
          <h3 className="text-white font-bold text-body-sm leading-tight line-clamp-1 tracking-tight">{exp.title}</h3>
          <p className="text-white/50 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-white font-bold text-body-sm tracking-tight">
              MK {exp.price.toLocaleString()}
            </p>
            <span className="text-caption text-white/40">{exp.duration}</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0">
            <Link
              href={`/experiences/${exp.id}`}
              onClick={(e) => { e.stopPropagation(); trackBooked(exp.id); }}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white text-caption font-bold tracking-wide shadow-[0_2px_12px_rgba(255,45,122,0.3)] hover:shadow-[0_4px_20px_rgba(255,45,122,0.45)] transition-all duration-300 text-center active:scale-[0.97]"
            >
              Book Now
            </Link>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-md border border-white/[0.15] flex items-center justify-center hover:bg-white/25 transition-all shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
