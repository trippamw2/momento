"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Experience } from "@/lib/types";
import { trackView, trackSaved, trackShared, trackGifted } from "@/lib/recommendation-engine";

interface DiscoveryFeedItemProps {
  experience: Experience;
  isActive: boolean;
  onSaveToggle: (id: string, saved: boolean) => void;
  onBook: (id: string) => void;
  isSaved: boolean;
}

export default function DiscoveryFeedItem({
  experience: exp,
  isActive,
  onSaveToggle,
  onBook,
  isSaved,
}: DiscoveryFeedItemProps) {
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  // Track view when this item becomes active
  if (isActive) {
    trackView(exp.id);
  }

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const next = !isSaved;
      trackSaved(exp.id);
      onSaveToggle(exp.id, next);
    },
    [exp.id, isSaved, onSaveToggle]
  );

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      trackShared(exp.id);
      if (navigator.share) {
        navigator.share({ title: exp.title, url: `${window.location.origin}/experiences/${exp.id}` }).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/experiences/${exp.id}`).then(() => {
          setShareFeedback(true);
          setTimeout(() => setShareFeedback(false), 2000);
        });
      }
    },
    [exp.id]
  );

  const handleGift = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      trackGifted(exp.id);
      router.push(`/gift?experience=${exp.id}`);
    },
    [exp.id]
  );

  const handleBook = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      trackView(exp.id);
      onBook(exp.id);
    },
    [exp.id, onBook]
  );

  return (
    <Link
      href={`/experiences/${exp.id}`}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#05070B]"
    >
      {/* Full-bleed image */}
      <div className="absolute inset-0">
        <Image
          src={exp.image}
          alt={exp.title}
          fill
          className={`object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-90" : "opacity-0"}`}
          sizes="100vw"
          priority={isActive}
          onLoad={() => setImgLoaded(true)}
        />
        {/* Loading shimmer */}
        {!imgLoaded && <div className="absolute inset-0 shimmer" />}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

      {/* Subtle brand glow */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#FF0F73]/5 via-transparent to-transparent" />

      {/* â”€â”€â”€ Bottom content â”€â”€â”€ */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 z-10">
        {/* Mood badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-caption text-white/90 font-semibold mb-3">
          {exp.mood[0] || exp.category}
        </div>

        {/* Title */}
        <h2 className="text-heading-xl sm:text-display-sm font-bold text-white mb-2 leading-tight max-w-2xl">
          {exp.title}
        </h2>

        {/* Subtitle */}
        <p className="text-white/60 text-body-sm sm:text-body max-w-xl line-clamp-2 mb-3">
          {exp.subtitle}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-white/50 text-caption">
          <span className="flex items-center gap-1">
            <span className="text-yellow-400">â˜…</span> {exp.rating}
          </span>
          <span>MK {exp.price.toLocaleString()}</span>
          <span>{exp.duration}</span>
          <span>{exp.location}</span>
        </div>
      </div>

      {/* â”€â”€â”€ Floating action buttons (right side) â”€â”€â”€ */}
      <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
        {/* Save */}
        <button
          onClick={handleSave}
          className="group/btn flex flex-col items-center gap-1"
          aria-label={isSaved ? "Unsave" : "Save"}
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-300 hover:bg-[#FF0F73]/30 hover:scale-110 active:scale-90">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isSaved ? "#FF0F73" : "none"}
              stroke={isSaved ? "#FF0F73" : "white"}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-[10px] text-white/60 group-hover/btn:text-white/90 transition-colors">
            {isSaved ? "Saved" : "Save"}
          </span>
        </button>

        {/* Gift */}
        <button
          onClick={handleGift}
          className="group/btn flex flex-col items-center gap-1"
          aria-label="Gift"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-300 hover:bg-[#FF7A1A]/30 hover:scale-110 active:scale-90">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <span className="text-[10px] text-white/60 group-hover/btn:text-white/90 transition-colors">Gift</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="group/btn flex flex-col items-center gap-1"
          aria-label="Share"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-90">
            {shareFeedback ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
          </div>
          <span className="text-[10px] text-white/60 group-hover/btn:text-white/90 transition-colors">
            {shareFeedback ? "Copied!" : "Share"}
          </span>
        </button>

        {/* Book */}
        <button
          onClick={handleBook}
          className="group/btn flex flex-col items-center gap-1"
          aria-label="Book"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] shadow-[0_2px_12px_rgba(255, 15, 115, 0.3)] flex items-center justify-center transition-all duration-300 hover:shadow-[0_4px_20px_rgba(255, 15, 115, 0.5)] hover:scale-110 active:scale-90">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span className="text-[10px] text-white/60 group-hover/btn:text-white/90 transition-colors">Book</span>
        </button>
      </div>

      {/* â”€â”€â”€ Progress indicator (bottom-left) â”€â”€â”€ */}
      {isActive && (
        <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 z-20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF0F73] animate-pulse" />
          <span className="text-caption text-white/50">Swipe up to explore</span>
        </div>
      )}
    </Link>
  );
}
