"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (media.type === "video" || media.type === "reel") {
      if (isActive && videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
        setPlaying(true);
      } else if (videoRef.current) {
        videoRef.current.pause();
        setPlaying(false);
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

  // Story type - show as image with story indicator
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
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const allMedia = exp.media && exp.media.length > 0 
    ? exp.media 
    : [{ type: "image" as MediaType, url: exp.image, thumbnail: exp.image }];

  const currentMedia = allMedia[currentMediaIndex];
  const hasMultipleMedia = allMedia.length > 1;

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

  const handleMediaChange = useCallback((index: number) => {
    setCurrentMediaIndex(index);
    setShowMediaPicker(false);
  }, []);

  const handleNextMedia = useCallback(() => {
    setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
  }, [allMedia.length]);

  const handlePrevMedia = useCallback(() => {
    setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  }, [allMedia.length]);

  // Auto-advance media for reels/stories when active
  useEffect(() => {
    if (isActive && (currentMedia.type === "reel" || currentMedia.type === "story")) {
      const timer = setTimeout(() => {
        handleNextMedia();
      }, currentMedia.type === "story" ? 5000 : 15000);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentMedia, currentMediaIndex, handleNextMedia]);

  return (
    <Link
      href={`/experiences/${exp.id}`}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Media carousel */}
      <div className="absolute inset-0">
        <MediaPlayer
          media={currentMedia}
          isActive={isActive}
          onLoad={() => setImgLoaded(true)}
          poster={currentMedia.thumbnail || exp.image}
        />
        
        {/* Loading shimmer */}
        {!imgLoaded && <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 animate-pulse" />}

        {/* Media indicator dots */}
        {hasMultipleMedia && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {allMedia.map((_, i) => (
              <button
                key={i}
                onClick={() => handleMediaChange(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentMediaIndex
                    ? "bg-white scale-125"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`View media ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Media type badge */}
        {(currentMedia.type === "video" || currentMedia.type === "reel") && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white/90">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <span>{currentMedia.type === "reel" ? "Reel" : "Video"}</span>
          </div>
        )}

        {/* Story progress bar */}
        {currentMedia.type === "story" && isActive && (
          <div className="absolute top-4 left-4 right-4 z-10 flex gap-1">
            {allMedia.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-0.5 rounded transition-all duration-300 ${
                  i < currentMediaIndex ? "bg-white" : i === currentMediaIndex ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/5 via-transparent to-transparent" />

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 z-10">
        {/* Category/Mood badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-xs text-white/90 font-semibold mb-3">
          {exp.mood[0] || exp.category}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight max-w-2xl">
          {exp.title}
        </h2>

        {/* Subtitle */}
        <p className="text-white/80 text-sm sm:text-base max-w-xl line-clamp-2 mb-3">
          {exp.subtitle}
        </p>

        {/* Meta row + Book */}
        <div className="flex items-center gap-2 text-white/50 text-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">★</span> {exp.rating}
            </span>
            <span>{exp.currency} {exp.price.toLocaleString()}</span>
            <span className="hidden xs:inline">{exp.duration}</span>
            <span className="truncate">{exp.location}</span>
          </div>
          <button
            onClick={handleBook}
            className="shrink-0 px-3 py-1 rounded-full bg-white text-black font-semibold text-[10px] hover:bg-white/90 transition-all duration-300 active:scale-[0.98] flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Book
          </button>
        </div>
      </div>

      {/* Floating action buttons (right side) */}
      <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
        {/* Save */}
        <button
          onClick={handleSave}
          className="group/btn flex flex-col items-center gap-1"
          aria-label={isSaved ? "Unsave" : "Save"}
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-90">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isSaved ? "white" : "none"}
              stroke={isSaved ? "white" : "white"}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-[10px] text-white/70 group-hover/btn:text-white/90 transition-colors">
            {isSaved ? "Saved" : "Save"}
          </span>
        </button>

        {/* Gift */}
        <button
          onClick={handleGift}
          className="group/btn flex flex-col items-center gap-1"
          aria-label="Gift"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-90">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <span className="text-[10px] text-white/70 group-hover/btn:text-white/90 transition-colors">Gift</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="group/btn flex flex-col items-center gap-1"
          aria-label="Share"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-90">
            {shareFeedback ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.58" y2="10.49" />
              </svg>
            )}
          </div>
          <span className="text-[10px] text-white/70 group-hover/btn:text-white/90 transition-colors">
            {shareFeedback ? "Copied" : "Share"}
          </span>
        </button>
      </div>
    </Link>
  );
}