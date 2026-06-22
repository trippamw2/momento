"use client";

import Image from "next/image";
import Link from "next/link";
import { Experience } from "@/lib/types";
import { useState, useCallback } from "react";

interface ExperienceCardProps {
  experience: Experience;
  size?: "sm" | "md";
  showCity?: boolean;
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

export default function ExperienceCard({ experience: exp, size = "md", showCity = true }: ExperienceCardProps) {
  const width = size === "sm" ? "w-52" : "w-72";
  const [saved, setSaved] = useState(() => loadSaved().includes(exp.id));

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

  return (
    <Link
      href={`/experiences/${exp.id}`}
      className={`${width} flex-shrink-0 snap-start group relative`}
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#111827] transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <Image
          src={exp.image}
          alt={exp.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 288px, 288px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-caption font-medium bg-white/[0.08] backdrop-blur-md text-white/90 border border-white/[0.08]">
            {exp.distance ? exp.distance : exp.city}
          </span>
        </div>

        <button
          onClick={toggleSave}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#FF2D7A]/60 translate-y-1 group-hover:translate-y-0"
        >
          <svg
            width="16" height="16"
            viewBox="0 0 24 24"
            fill={saved ? "white" : "none"}
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-yellow-400 text-[11px]">★</span>
            <span className="text-caption text-white/80 font-medium">{exp.rating}</span>
            <span className="text-caption text-white/30">·</span>
            <span className="text-caption text-white/50">{exp.reviewCount}</span>
          </div>
          <h3 className="text-white font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
          <p className="text-white/50 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
          <p className="text-white font-semibold text-body-sm mt-1.5">
            MK {exp.price.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}