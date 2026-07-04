"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { findNearestCity } from "@/lib/geo";
import { useGeolocation } from "@/lib/use-geolocation";

const MOMENTO_CATEGORIES = [
  "Date",
  "Chill",
  "Celebrate",
  "Escape",
] as const;

export default function ListExperiencePage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner", redirectTo: "/?auth=partner-required" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }, [fieldErrors]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Title is required";
    else if (form.title.trim().length < 5) errors.title = "Title must be at least 5 characters";
    if (!form.category) errors.category = "Please select a category";
    if (!form.description.trim()) errors.description = "Description is required";
    else if (form.description.trim().length < 20) errors.description = "Description must be at least 20 characters";
    if (!form.price) errors.price = "Price is required";
    else if (isNaN(Number(form.price)) || Number(form.price) <= 0) errors.price = "Enter a valid price greater than 0";
    if (!form.duration.trim()) errors.duration = "Duration is required";
    if (!form.location) errors.location = "Please select a location";
    if (!form.contact.trim()) errors.contact = "Contact email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact)) errors.contact = "Invalid email format";
    const cap = parseInt(form.capacity);
    if (!form.capacity) errors.capacity = "Capacity is required";
    else if (isNaN(cap) || cap < 1) errors.capacity = "Capacity must be at least 1";
    else if (cap > 100) errors.capacity = "Capacity cannot exceed 100";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
          subtitle: form.subtitle || `${form.title} â€” A Momento Experience`,
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

  if (authLoading) {
    return (
      <div className="pt-24 pb-20 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-lg mx-auto px-4 sm:px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FF0F73]/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-heading-xl font-bold text-[#F1F5F9] mb-3">Partner Access Required</h1>
          <p className="text-[#94A3B8] text-body mb-6">
            Please sign in with a partner account to list an experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-lg mx-auto px-4 sm:px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FF0F73]/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-heading-xl font-bold text-[#F1F5F9] mb-3">Submission Received</h1>
          <p className="text-[#94A3B8] text-body mb-6">
            Thank you! Our team will review your experience and get back to you within 3&ndash;5 business days.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all duration-300"
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
          <h1 className="text-display-sm font-bold text-[#F1F5F9] mb-2">List Your Experience</h1>
          <p className="text-[#94A3B8] text-body-lg">
            Share your unique experience with the Momento community. Fill out the details below and our team will review your listing.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-500/20 text-red-400 text-body-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-body-sm font-semibold text-[#F1F5F9] mb-1.5">Experience Title</label>
            <input
              id="title"
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Sunset Wine Tasting at Cape Maclear"
              className={`w-full px-4 py-3 rounded-xl bg-[#1A2332] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.title
                  ? "border border-red-500 focus:ring-red-500/30 focus:border-red-500"
                  : "border border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
              }`}
            />
            {fieldErrors.title && <p className="mt-1 text-caption text-red-400">{fieldErrors.title}</p>}
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-body-sm font-semibold text-[#F1F5F9] mb-1.5">Subtitle (optional)</label>
            <input
              id="subtitle"
              type="text"
              value={form.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="e.g. Sun, Swim & Sip by the lake"
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-[#1A2332] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] transition-all"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-body-sm font-semibold text-[#F1F5F9] mb-1.5">Category</label>
            <select
              id="category"
              required
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl bg-[#1A2332] text-[#F1F5F9] text-body-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                fieldErrors.category
                  ? "border border-red-500 focus:ring-red-500/30 focus:border-red-500"
                  : "border border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
              }`}
            >
              <option value="" disabled>Select a category</option>
              {MOMENTO_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {fieldErrors.category && <p className="mt-1 text-caption text-red-400">{fieldErrors.category}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-body-sm font-semibold text-[#F1F5F9] mb-1.5">Description</label>
            <textarea
              id="description"
              required
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe what guests will experience, what makes it unique, and what they should expect."
              className={`w-full px-4 py-3 rounded-xl bg-[#1A2332] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-2 transition-all resize-y ${
                fieldErrors.description
                  ? "border border-red-500 focus:ring-red-500/30 focus:border-red-500"
                  : "border border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
              }`}
            />
            {fieldErrors.description && <p className="mt-1 text-caption text-red-400">{fieldErrors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-body-sm font-semibold text-[#F1F5F9] mb-1.5">Price (MK)</label>
              <input
                id="price"
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="50000"
                className={`w-full px-4 py-3 rounded-xl bg-[#1A2332] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.price
                    ? "border border-red-500 focus:ring-red-500/30 focus:border-red-500"
                    : "border border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
                }`}
              />
              {fieldErrors.price && <p className="mt-1 text-caption text-red-400">{fieldErrors.price}</p>}
            </div>
            <div>
              <label htmlFor="duration" className="block text-body-sm font-semibold text-[#F1F5F9] mb-1.5">Duration</label>
              <input
                id="duration"
                type="text"
                required
                value={form.duration}
                onChange={(e) => updateField("duration", e.target.value)}
                placeholder="e.g. 2 hours, Full day"
                className={`w-full px-4 py-3 rounded-xl bg-[#1A2332] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.duration
                    ? "border border-red-500 focus:ring-red-500/30 focus:border-red-500"
                    : "border border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
                }`}
              />
              {fieldErrors.duration && <p className="mt-1 text-caption text-red-400">{fieldErrors.duration}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-body-sm font-semibold text-[#F1F5F9] mb-1.5">Location</label>
              <select
                id="location"
                required
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-[#1A2332] text-[#F1F5F9] text-body-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                  fieldErrors.location
                    ? "border border-red-500 focus:ring-red-500/30 focus:border-red-500"
                    : "border border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
                }`}
              >
                <option value="" disabled>
                  {geo.loading ? "Detecting location..." : "Select a city"}
                </option>
                <option value="Lilongwe">Lilongwe</option>
                <option value="Blantyre">Blantyre</option>
              </select>
              {fieldErrors.location && <p className="mt-1 text-caption text-red-400">{fieldErrors.location}</p>}
              {geo.loading && !form.location && (
                <p className="text-caption text-[#64748B] mt-1 animate-pulse">Detecting your location via GPS...</p>
              )}
              {geo.position && form.location && (
                <p className="text-caption text-[#FF0F73] mt-1">ðŸ“ Auto-detected</p>
              )}
            </div>
            <div>
              <label htmlFor="capacity" className="block text-body-sm font-semibold text-[#F1F5F9] mb-1.5">Max Guests</label>
              <input
                id="capacity"
                type="number"
                required
                min={1}
                value={form.capacity}
                onChange={(e) => updateField("capacity", e.target.value)}
                placeholder="10"
                className={`w-full px-4 py-3 rounded-xl bg-[#1A2332] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.capacity
                    ? "border border-red-500 focus:ring-red-500/30 focus:border-red-500"
                    : "border border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
                }`}
              />
              {fieldErrors.capacity && <p className="mt-1 text-caption text-red-400">{fieldErrors.capacity}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="contact" className="block text-body-sm font-semibold text-[#F1F5F9] mb-1.5">Contact Email</label>
            <input
              id="contact"
              type="email"
              required
              value={form.contact}
              onChange={(e) => updateField("contact", e.target.value)}
              placeholder="you@example.com"
              className={`w-full px-4 py-3 rounded-xl bg-[#1A2332] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.contact
                  ? "border border-red-500 focus:ring-red-500/30 focus:border-red-500"
                  : "border border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
              }`}
            />
            {fieldErrors.contact && <p className="mt-1 text-caption text-red-400">{fieldErrors.contact}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            className="text-body-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
