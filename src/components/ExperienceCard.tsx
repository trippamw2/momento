"use client";

import Image from "next/image";
import Link from "next/link";
import { Experience } from "@/lib/types";
import { useState, useCallback } from "react";

const MOOD_GRADIENTS: Record<string, string> = {
  Romantic: "from-rose-500 to-pink-500",
  Relax: "from-emerald-500 to-teal-500",
  Celebrate: "from-amber-500 to-orange-500",
  Escape: "from-cyan-500 to-sky-500",
  Indulge: "from-fuchsia-500 to-purple-500",
  "Food & Drink": "from-amber-600 to-orange-600",
  Family: "from-indigo-500 to-blue-500",
  Entertainment: "from-violet-500 to-purple-500",
  Adventure: "from-red-500 to-rose-500",
  "Self Care": "from-green-500 to-emerald-500",
  Social: "from-pink-500 to-rose-500",
};

interface ExperienceCardProps {
  experience: Experience;
  size?: "sm" | "md" | "lg";
}

function loadSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("momento-saved");
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
  const primaryMood = exp.mood[0];
  const moodGradient = MOOD_GRADIENTS[primaryMood] || "from-rose-500 to-pink-500";

  const toggleSave = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = loadSaved();
    const next = saved ? current.filter((id: string) => id !== exp.id) : [...current, exp.id];
    try {
      const raw = localStorage.getItem("momento-saved");
      const state = raw ? JSON.parse(raw) : { savedIds: [], collections: [] };
      state.savedIds = next;
      localStorage.setItem("momento-saved", JSON.stringify(state));
    } catch {}
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
    <Link href={`/experiences/${exp.id}`} className={`${width} flex-shrink-0 snap-start group relative`}>
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#f0f0f0] transition-all duration-500 group-hover:shadow-lg">
        <Image
          src={exp.image}
          alt={exp.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 288px, 288px"
        />
        {/* Dark fallback when image hasn't loaded */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
        <div className="card-overlay-gradient absolute inset-0" />

        {/* Mood Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1.5 rounded-full text-caption font-medium text-white bg-black/40 backdrop-blur-md border border-white/20 shadow-sm">
            {primaryMood}
          </span>
        </div>

        {/* Save Button */}
        <button onClick={toggleSave} className="absolute top-3 right-3 card-action-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "#ff385c" : "none"} stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-yellow-400 text-[11px]">★</span>
            <span className="text-caption text-white/80 font-medium">{exp.rating}</span>
            <span className="text-caption text-white/30">·</span>
            <span className="text-caption text-white/50">{exp.reviewCount} reviews</span>
          </div>
          <h3 className="text-white font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
          <p className="text-white/50 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
          <p className="text-white font-semibold text-body-sm mt-1.5">MK {exp.price.toLocaleString()}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0">
            <Link
              href="/gift"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white text-caption font-medium border border-white/[0.15] hover:bg-white/25 transition-all"
            >
              Gift
            </Link>
            <Link
              href={`/experiences/${exp.id}#book`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-lg bg-[#ff385c] text-white text-caption font-medium shadow-sm hover:bg-[#e00b41] transition-all"
            >
              Book Now
            </Link>
            <button onClick={handleShare} className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white text-caption font-medium border border-white/[0.15] hover:bg-white/25 transition-all">
              {shareFeedback ? "Copied ✓" : "Share"}
            </button>
          </div>
          </div>
        </div>
    </Link>
  );
}
