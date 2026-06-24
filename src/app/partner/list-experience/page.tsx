"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { findNearestCity } from "@/lib/geo";
import { useGeolocation } from "@/lib/use-geolocation";

const V2_CATEGORIES = [
  "Date Night",
  "Pool & Chill",
  "Spa & Wellness",
  "Brunch & Dining",
  "Staycation",
  "Celebrations",
] as const;

export default function ListExperiencePage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    category: "",
    description: "",
    price: "",
    duration: "",
    location: "",
    contact: "",
    capacity: "10",
  });

  const geo = useGeolocation();

  // Auto-detect city to pre-fill location
  useEffect(() => {
    if (geo.position && !form.location) {
      const city = findNearestCity(geo.position.lat, geo.position.lng);
      if (city) {
        setForm((prev) => ({ ...prev, location: city }));
      }
    }
  }, [geo.position, form.location]);

  // Auto-request GPS on mount
  useEffect(() => {
    if (!geo.position && !geo.loading && !geo.error && geo.permission === "prompt") {
      const t = setTimeout(() => geo.requestPosition(), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const token = localStorage.getItem("momento-auth-token");
    if (!token) {
      setError("Please sign in as a partner to list an experience.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle || `${form.title} — A Momento Experience`,
          description: form.description,
          price: parseInt(form.price),
          duration: form.duration,
          category: form.category,
          location: form.location,
          capacity: parseInt(form.capacity) || 10,
          max_guests: parseInt(form.capacity) || 10,
          status: "draft",
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
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

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-body-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Experience Title</label>
            <input
              id="title"
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Sunset Wine Tasting at Cape Maclear"
              className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
            />
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Subtitle (optional)</label>
            <input
              id="subtitle"
              type="text"
              value={form.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="e.g. Sun, Swim & Sip by the lake"
              className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Category</label>
            <select
              id="category"
              required
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
            >
              <option value="" disabled>Select a category</option>
              {V2_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Description</label>
            <textarea
              id="description"
              required
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
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
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
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
                value={form.duration}
                onChange={(e) => updateField("duration", e.target.value)}
                placeholder="e.g. 2 hours, Full day"
                className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Location</label>
              <select
                id="location"
                required
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  {geo.loading ? "Detecting location..." : "Select a city"}
                </option>
                <option value="Lilongwe">Lilongwe</option>
                <option value="Blantyre">Blantyre</option>
              </select>
              {geo.loading && !form.location && (
                <p className="text-caption text-text-tertiary mt-1 animate-pulse">Detecting your location via GPS...</p>
              )}
              {geo.position && form.location && (
                <p className="text-caption text-[#ff385c] mt-1">📍 Auto-detected</p>
              )}
            </div>
            <div>
              <label htmlFor="capacity" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Max Guests</label>
              <input
                id="capacity"
                type="number"
                required
                min={1}
                value={form.capacity}
                onChange={(e) => updateField("capacity", e.target.value)}
                placeholder="10"
                className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact" className="block text-body-sm font-semibold text-[#222222] mb-1.5">Contact Email</label>
            <input
              id="contact"
              type="email"
              required
              value={form.contact}
              onChange={(e) => updateField("contact", e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-white text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#ff385c]/30 focus:border-[#ff385c] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Review"
            )}
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
