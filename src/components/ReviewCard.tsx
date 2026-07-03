"use client";

import { useState } from "react";

interface ReviewCardProps {
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  text: string;
  className?: string;
}

export default function ReviewCard({ author, avatar, rating, date, text, className = "" }: ReviewCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`p-4 rounded-2xl bg-[#0A0E17] border border-white/[0.06] ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white text-caption font-bold shrink-0">
          {avatar && !imgError ? (
            <img src={avatar} alt={author} className="w-full h-full rounded-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <span>{author.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <p className="text-body-sm font-semibold text-white">{author}</p>
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
    </div>
  );
}
