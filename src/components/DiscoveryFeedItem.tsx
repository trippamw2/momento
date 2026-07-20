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
      return { label: "New", icon: "new" };
    }
  }

  // Trending (high bookings)
  if (bookedCount && bookedCount > 80) {
    return { label: "Trending", icon: "trending" };
  }

  // Top Rated
  if (rating >= 4.8) {
    return { label: "Top Rated", icon: "star" };
  }

  // Featured
  if (featured) {
    return { label: "Featured", icon: "featured" };
  }

  // Frequently Gifted
  if (giftCount && giftCount > 20) {
    return { label: "Frequently Gifted", icon: "gift" };
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
      className="flex items-stretch gap-3 p-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
    >
      {/* ─── Media Thumbnail ─── */}
      <div className="w-28 sm:w-36 h-28 sm:h-36 rounded-xl overflow-hidden shrink-0 bg-white/[0.03] relative">
        <div className="absolute inset-0">
          <img
            src={currentMedia.url}
            alt=""
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 animate-pulse" />
          )}
        </div>
        {badge && (
          <div className="absolute top-1.5 left-1.5 z-10">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] text-white/80 font-medium">
              {badge.icon === "star" ? (
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              ) : badge.icon === "trending" ? (
                <svg className="w-3 h-3 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              ) : badge.icon === "new" ? (
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-3 h-3 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              )}
              <span>{badge.label}</span>
            </span>
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h2 className="text-sm font-bold text-white mb-0.5 leading-snug line-clamp-1">{exp.title}</h2>
          {tagline && (
            <p className="text-xs text-white/50 line-clamp-1 mb-2">{tagline}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <span className="flex items-center gap-0.5">
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              <span className="text-white/70 font-medium">{exp.rating}</span>
            </span>
            <span className="text-white/80 font-semibold">{exp.currency} {exp.price.toLocaleString()}</span>
            <span className="truncate">{exp.location}</span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleBook}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-xs hover:shadow-[0_2px_8px_rgba(255,15,115,0.3)] transition-all active:scale-[0.97]"
          >
            Book
          </button>
          <button
            onClick={handleSave}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isSaved
                ? "border-[#FF0F73] text-[#FF0F73] bg-[#FF0F73]/10"
                : "border-white/[0.1] text-white/50 hover:bg-white/5"
            }`}
          >
            <svg className="w-3.5 h-3.5 inline mr-1" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isSaved ? "Saved" : "Save"}
          </button>
          <button onClick={handleGift} className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/50 text-xs hover:bg-white/5 transition-all">
            <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="12" rx="2" /><path d="M12 10a2 2 0 100 4 2 2 0 000-4z" /><path d="M2 11h20" /></svg>
            Gift
          </button>
          <button onClick={handleShare} className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/50 text-xs hover:bg-white/5 transition-all">
            {shareFeedback ? (
              <svg className="w-3.5 h-3.5 inline text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.58" y2="10.49" /></svg>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
