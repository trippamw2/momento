"use client";

import { useState } from "react";

interface ReviewFormProps {
  experienceId: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ experienceId, onSubmitted, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    if (text.trim().length < 10) {
      setError("Please write at least 10 characters");
      return;
    }

    setSubmitting(true);
    setError("");

    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));

    // Save to localStorage for persistence
    try {
      const key = `experio-reviews-${experienceId}`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.unshift({
        id: `rev-${Date.now()}`,
        author: "You",
        rating,
        text: text.trim(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        timestamp: Date.now(),
      });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch { /* ignore */ }

    setSubmitting(false);
    setSubmitted(true);
    onSubmitted?.();
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-2xl bg-[#111827] border border-white/[0.08] text-center">
        <div className="text-3xl mb-3">🎉</div>
        <h3 className="text-body font-semibold text-white mb-1">Thank you for your review!</h3>
        <p className="text-caption text-[#94A3B8]">Your feedback helps other explorers.</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[#111827] border border-white/[0.08]">
      <h3 className="text-body font-semibold text-white mb-4">Write a Review</h3>

      {/* Star Rating */}
      <div className="mb-4">
        <p className="text-caption text-[#94A3B8] mb-2">Your rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <svg
                className={`w-7 h-7 ${
                  star <= (hoverRating || rating) ? "text-yellow-400" : "text-[#333]"
                } transition-colors`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="text-caption text-[#64748B] ml-2">
            {rating > 0 ? `${rating}/5` : "Tap to rate"}
          </span>
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <p className="text-caption text-[#94A3B8] mb-2">Your review</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience... What did you enjoy? Any tips for future visitors?"
          rows={4}
          className="w-full bg-[#0A0E17] border border-white/[0.08] rounded-xl p-3 text-white text-body-sm placeholder-[#64748B] outline-none focus:border-[#FF0F73]/40 resize-none transition-colors"
        />
        <p className="text-caption text-[#64748B] mt-1">{text.length} characters</p>
      </div>

      {error && (
        <p className="text-caption text-red-400 mb-3">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white text-caption font-bold tracking-wide hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-caption text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
