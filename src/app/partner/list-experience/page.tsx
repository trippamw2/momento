"use client";

import { useState } from "react";
import Link from "next/link";

export default function ListExperiencePage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-lg mx-auto px-4 sm:px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ff385c]/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#ff385c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-heading-xl font-bold text-[#222222] mb-3">Submission Received</h1>
          <p className="text-[#6a6a6a] text-body mb-6">
            Thank you! Our team will review your experience and get back to you within 3&ndash;5 business days.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <h1 className="text-display-sm font-bold text-[#222222] mb-2">List Your Experience</h1>
          <p className="text-[#6a6a6a] text-body-lg">
            Share your unique experience with the Momento community. Fill out the details below and our team will review your listing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Experience Title</label>
            <input
              id="title"
              type="text"
              required
              placeholder="e.g. Sunset Wine Tasting at Cape Maclear"
              className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Category</label>
            <select
              id="category"
              required
              defaultValue=""
              className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
            >
              <option value="" disabled>Select a category</option>
              <option value="food-drink">Food & Drink</option>
              <option value="adventure">Adventure</option>
              <option value="wellness">Wellness & Self Care</option>
              <option value="romantic">Romantic</option>
              <option value="family">Family</option>
              <option value="luxury">Luxury</option>
              <option value="celebrations">Celebrations</option>
              <option value="arts">Arts & Culture</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Description</label>
            <textarea
              id="description"
              required
              rows={4}
              placeholder="Describe what guests will experience, what makes it unique, and what they should expect."
              className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Price (MK)</label>
              <input
                id="price"
                type="number"
                required
                min={0}
                placeholder="50000"
                className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Duration</label>
              <input
                id="duration"
                type="text"
                required
                placeholder="e.g. 2 hours, Full day"
                className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Location</label>
            <input
              id="location"
              type="text"
              required
              placeholder="e.g. Lilongwe, Cape Maclear, Blantyre"
              className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
            />
          </div>

          <div>
            <label htmlFor="contact" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Contact Email</label>
            <input
              id="contact"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300"
          >
            Submit for Review
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-body-sm text-[#6a6a6a] hover:text-[#222222] transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
