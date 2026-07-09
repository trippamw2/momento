"use client";

import { useState } from "react";
import Image from "next/image";

interface ReviewCardProps {
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  text: string;
  photos?: string[];
  verified?: boolean;
  className?: string;
}

export default function ReviewCard({ author, avatar, rating, date, text, photos, verified, className = "" }: ReviewCardProps) {
  const [imgError, setImgError] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<number | null>(null);

  return (
    <div className={`p-4 rounded-2xl bg-[#0A0E17] border border-white/[0.06] ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white text-caption font-bold shrink-0 relative">
          {avatar && !imgError ? (
            <Image src={avatar} alt={author} fill className="rounded-full object-cover" onError={() => setImgError(true)} unoptimized />
          ) : (
            <span>{author.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-body-sm font-semibold text-white truncate">{author}</p>
            {verified && (
              <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3 h-3 ${star <= rating ? "text-yellow-400" : "text-[#333]"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-caption text-[#64748B]">{date}</span>
          </div>
        </div>
      </div>

      <p className="text-body-sm text-[#CBD5E1] leading-relaxed">{text}</p>

      {/* Photo Gallery */}
      {photos && photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setExpandedPhoto(expandedPhoto === i ? null : i)}
              className={`relative rounded-lg overflow-hidden border border-white/[0.06] transition-all duration-200 ${
                expandedPhoto === i ? "w-full aspect-video" : "w-16 h-16"
              }`}
            >
              <Image
                src={src}
                alt={`Review photo ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
