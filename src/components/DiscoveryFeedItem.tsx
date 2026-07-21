"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Experience, MediaType } from "@/lib/types";
import { trackView, trackSaved, trackShared, trackGifted } from "@/lib/recommendation-engine";

interface DiscoveryFeedItemProps {
  experience: Experience;
  isSaved: boolean;
  onSaveToggle: (id: string, saved: boolean) => void;
  onBook: (id: string) => void;
}

// ─── Social proof badge ───

interface SocialBadge {
  label: string;
  icon: string;
}

function getSocialBadge(exp: Experience): SocialBadge | null {
  const { bookedCount, rating, giftCount, createdAt, featured } = exp;

  if (createdAt) {
    const age = Date.now() - new Date(createdAt).getTime();
    if (age < 30 * 24 * 60 * 60 * 1000) {
      return { label: "New", icon: "new" };
    }
  }
  if (bookedCount && bookedCount > 80) {
    return { label: "Trending", icon: "trending" };
  }
  if (rating >= 4.8) {
    return { label: "Top Rated", icon: "star" };
  }
  if (featured) {
    return { label: "Featured", icon: "featured" };
  }
  if (giftCount && giftCount > 20) {
    return { label: "Frequently Gifted", icon: "gift" };
  }
  return null;
}

// ─── Badge icon ───

function BadgeIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "star":
      return <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    case "trending":
      return <svg className="w-3 h-3 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
    case "new":
      return <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case "featured":
      return <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
    case "gift":
      return <svg className="w-3 h-3 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="12" rx="2" /><path d="M12 10v4" /><path d="M2 11h20" /></svg>;
    default:
      return null;
  }
}

// ─── Media Section ───

function MediaSection({ experience: exp }: { experience: Experience }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  const allMedia = exp.media && exp.media.length > 0
    ? exp.media
    : [{ type: "image" as MediaType, url: exp.image, thumbnail: exp.image }];

  const currentMedia = allMedia[0];
  const badge = useMemo(() => getSocialBadge(exp), [exp]);

  return (
    <div className="relative w-full overflow-hidden bg-white/[0.02]">
      {/* Aspect ratio container */}
      <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
        <img
          ref={imgRef}
          src={currentMedia.url}
          alt={exp.title}
          className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
        />
        {/* Skeleton loader */}
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-white/[0.03] animate-pulse" />
        )}
        {/* Gradient fade at bottom for readability */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white/90 font-medium">
              <BadgeIcon icon={badge.icon} />
              <span>{badge.label}</span>
            </span>
          </div>
        )}

        {/* Price pill */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white/90 font-semibold">
            {exp.currency} {exp.price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───

export default function DiscoveryFeedItem({
  experience: exp,
  isSaved,
  onSaveToggle,
  onBook,
}: DiscoveryFeedItemProps) {
  const router = useRouter();
  const [shareFeedback, setShareFeedback] = useState(false);

  // Track view when component mounts (visible in feed = it's been seen)
  useEffect(() => {
    trackView(exp.id);
  }, [exp.id]);

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
  const badge = useMemo(() => getSocialBadge(exp), [exp]);

  return (
    <Link
      href={`/experiences/${exp.id}`}
      className="block w-full border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
    >
      {/* ─── Media ─── */}
      <MediaSection experience={exp} />

      {/* ─── Content ─── */}
      <div className="px-4 py-3 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white leading-snug line-clamp-1">{exp.title}</h2>
            {tagline && (
              <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{tagline}</p>
            )}
          </div>
          {/* Rating */}
          <div className="flex items-center gap-1 shrink-0">
            <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            <span className="text-xs text-white/80 font-semibold">{exp.rating}</span>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-white/40">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {exp.location}
          </span>
          {exp.duration && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
              {exp.duration}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            {exp.bookedCount || 0} booked
          </span>
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleBook}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-xs hover:shadow-[0_2px_8px_rgba(255,15,115,0.3)] transition-all active:scale-[0.97]"
          >
            Reserve
          </button>
          <button
            onClick={handleSave}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
              isSaved
                ? "border-[#FF0F73] text-[#FF0F73] bg-[#FF0F73]/10"
                : "border-white/[0.1] text-white/50 hover:bg-white/5"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={handleGift}
            className="px-3 py-2 rounded-lg border border-white/[0.1] text-white/50 text-xs hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="7" width="20" height="12" rx="2" />
              <path d="M12 10v4" />
              <path d="M2 11h20" />
            </svg>
            Gift
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-2 rounded-lg border border-white/[0.1] text-white/50 text-xs hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            {shareFeedback ? (
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.58" y2="10.49" />
              </svg>
            )}
            {shareFeedback ? "Copied!" : "Share"}
          </button>
        </div>
      </div>
    </Link>
  );
}
