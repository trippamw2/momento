"use client";

import Image from "next/image";
import Link from "next/link";
import { Experience } from "@/lib/types";

interface ExperienceCardProps {
  experience: Experience;
  size?: "sm" | "md";
}

export default function ExperienceCard({ experience, size = "md" }: ExperienceCardProps) {
  const width = size === "sm" ? "w-48" : "w-64";

  return (
    <Link
      href={`/experiences/${experience.id}`}
      className={`${width} flex-shrink-0 snap-start group relative`}
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-tertiary card-hover">
        <Image
          src={experience.image}
          alt={experience.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 256px, 256px"
        />
        <div className="gradient-overlay-bottom absolute inset-0" />

        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 rounded-full text-caption font-medium bg-white/10 backdrop-blur-md text-white/90 border border-white/10">
            {experience.distance}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-brand-hot-pink/60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-yellow-400 text-[10px]">★</span>
            <span className="text-caption text-white/80 font-medium">{experience.rating}</span>
            <span className="text-caption text-white/40">·</span>
            <span className="text-caption text-white/50">{experience.reviewCount}</span>
          </div>
          <h3 className="text-text-primary font-semibold text-body-sm leading-tight line-clamp-1">{experience.title}</h3>
          <p className="text-white/60 text-caption mt-0.5 line-clamp-1">{experience.subtitle}</p>
          <p className="text-text-primary font-semibold text-body-sm mt-1.5">
            MK {experience.price.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
