"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Experience, MediaType } from "@/lib/types";
import { trackView, trackSaved, trackShared, trackGifted } from "@/lib/recommendation-engine";

interface DiscoveryFeedItemProps {
  experience: Experience;
  isActive: boolean;
  onSaveToggle: (id: string, saved: boolean) => void;
  onBook: (id: string) => void;
  isSaved: boolean;
}

// ─── Social proof badge config ───

interface SocialBadge {
  label: string;
  icon: string;
}

function getSocialBadge(exp: Experience): SocialBadge | null {
  const { bookedCount, rating, giftCount, createdAt, featured } = exp;

  // New badge (within 30 days)
  if (createdAt) {
    const age = Date.now() - new Date(createdAt).getTime();
    if (age < 30 * 24 * 60 * 60 * 1000) {
      return { label: "New", icon: "✨" };
    }
  }

  // Trending (high bookings)
  if (bookedCount && bookedCount > 80) {
    return { label: "Trending", icon: "🔥" };
  }

  // Top Rated
  if (rating >= 4.8) {
    return { label: "Top Rated", icon: "⭐" };
  }

  // Featured
  if (featured) {
    return { label: "Featured", icon: "✦" };
  }

  // Frequently Gifted
  if (giftCount && giftCount > 20) {
    return { label: "Frequently Gifted", icon: "🎁" };
  }

  return null;
}

// ─── Media Player ───

function MediaPlayer({
  media,
  isActive,
  onLoad,
  poster
}: {
  media: { type: MediaType; url: string; thumbnail?: string; duration?: number };
  isActive: boolean;
  onLoad?: () => void;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (media.type === "video" || media.type === "reel") {
      if (isActive && videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      } else if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isActive, media.type]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  if (media.type === "image") {
    return (
      <Image
        src={media.url}
        alt=""
        fill
        className={`object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
        sizes="100vw"
        priority={isActive}
        onLoad={handleLoad}
      />
    );
  }

  if (media.type === "video" || media.type === "reel") {
    return (
      <video
        ref={videoRef}
        src={media.url}
        poster={poster || media.thumbnail || media.url}
        className={`w-full h-full object-cover ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-700`}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={handleLoad}
      />
    );
  }

  return (
    <Image
      src={media.url}
      alt=""
      fill
      className={`object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
      sizes="100vw"
      priority={isActive}
      onLoad={handleLoad}
    />
  );
}

// ─── Main Component ───

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

  const allMedia = exp.media && exp.media.length > 0
    ? exp.media
    : [{ type: "image" as MediaType, url: exp.image, thumbnail: exp.image }];

  const currentMedia = allMedia[0];

  // Track view on active
  if (isActive) {
    trackView(exp.id);
  }

  const badge = useMemo(() => getSocialBadge(exp), [exp]);

  // ─── Handlers ───

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
    [exp.id, router]
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

  const tagline = exp.emotionalHeadline || exp.subtitle;

  return (
    <Link
      href={`/experiences/${exp.id}`}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
    >
      {/* ─── Media ─── */}
      <div className="absolute inset-0">
        <MediaPlayer
          media={currentMedia}
          isActive={isActive}
          onLoad={() => setImgLoaded(true)}
          poster={currentMedia.thumbnail || exp.image}
        />

        {/* Loading shimmer */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 animate-pulse" />
        )}
      </div>

      {/* ─── Gradient overlays (clean, minimal) ─── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />

      {/* ─── Social Proof Badge (1 max, top left) ─── */}
      {badge && (
        <div className="absolute top-4 left-4 z-20">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs text-white/90 font-medium">
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </span>
        </div>
      )}

      {/* ─── Bottom Content ─── */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 z-10">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight max-w-2xl">
          {exp.title}
        </h2>

        {/* Emotional tagline */}
        {tagline && (
          <p className="text-white/70 text-sm sm:text-base max-w-xl line-clamp-1 mb-3 font-light">
            {tagline}
          </p>
        )}

        {/* Meta row: rating, price, location + Book CTA */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0 text-white/60 text-xs">
            <span className="flex items-center gap-1 text-white/80">
              <span className="text-yellow-400">★</span>
              <span className="font-medium">{exp.rating}</span>
            </span>
            <span className="font-semibold text-white text-sm">
              {exp.currency} {exp.price.toLocaleString()}
            </span>
            <span className="truncate">{exp.location}</span>
          </div>

          <button
            onClick={handleBook}
            className="shrink-0 px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all duration-300 active:scale-[0.97]"
          >
            Book
          </button>
        </div>
      </div>

      {/* ─── Floating Action Buttons (right side, 3 max) ─── */}
      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
        {/* Save */}
        <button
          onClick={handleSave}
          className="group/btn flex flex-col items-center gap-0.5"
          aria-label={isSaved ? "Unsave" : "Save"}
        >
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-300 hover:bg-white/15 active:scale-90">
            <svg
              width="18" height="18" viewBox="0 0 24 24"
              fill={isSaved ? "white" : "none"}
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-[9px] text-white/60 group-hover/btn:text-white/90 transition-colors">
            {isSaved ? "Saved" : "Save"}
          </span>
        </button>

        {/* Gift */}
        <button
          onClick={handleGift}
          className="group/btn flex flex-col items-center gap-0.5"
          aria-label="Gift"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-300 hover:bg-white/15 active:scale-90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <span className="text-[9px] text-white/60 group-hover/btn:text-white/90 transition-colors">Gift</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="group/btn flex flex-col items-center gap-0.5"
          aria-label="Share"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-300 hover:bg-white/15 active:scale-90">
            {shareFeedback ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.58" y2="10.49" />
              </svg>
            )}
          </div>
          <span className="text-[9px] text-white/60 group-hover/btn:text-white/90 transition-colors">
            {shareFeedback ? "Copied" : "Share"}
          </span>
        </button>
      </div>
    </Link>
  );
}
