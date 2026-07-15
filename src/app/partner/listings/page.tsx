"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface Experience {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  location: string;
  status: "draft" | "active" | "unlisted" | "published";
  rating: number;
  review_count: number;
  booking_count: number;
  revenue: number;
  images: string[];
  max_guests: number;
}

export default function ListingsPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "draft" | "unlisted">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !isPartner) return;
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;

    fetch("/api/experiences/partner", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        const mapped = (Array.isArray(data) ? data : data?.experiences ?? []).map((e: any) => ({
          id: String(e.id ?? ""),
          title: String(e.title ?? e.name ?? "Untitled"),
          subtitle: e.subtitle,
          description: e.description,
          price: Number(e.price ?? 0),
          duration: e.duration,
          category: e.category,
          location: e.location,
          status: String(e.status ?? "draft"),
          rating: Number(e.rating ?? 0),
          review_count: Number(e.review_count ?? 0),
          booking_count: Number(e.booking_count ?? 0),
          revenue: Number(e.revenue ?? 0),
          images: Array.isArray(e.images) ? e.images : (e.image ? [e.image] : []),
          max_guests: Number(e.max_guests ?? e.capacity ?? 10),
        }));
        setExperiences(mapped);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load experiences. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [authLoading, isPartner]);

  const filteredExperiences = experiences
    .filter((e) => (filter === "all" || (filter === "live" && (e.status === "active" || e.status === "published")) || (filter === "draft" && e.status === "draft") || (filter === "unlisted" && e.status === "unlisted")))
    .filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
      case "published":
        return { label: "Live", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" };
      case "draft":
        return { label: "Draft", className: "bg-white/10 text-white/70 border-white/20", dot: "bg-white/40" };
      case "unlisted":
        return { label: "Unlisted", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400" };
      default:
        return { label: status, className: "bg-white/10 text-white/60 border-white/20", dot: "bg-white/40" };
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-white mb-1">Your Listings</h1>
          <p className="text-[#64748B] text-body-lg">Manage and edit your experiences</p>
        </div>
        <Link
          href="/partner/menu/create"
          className="px-5 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all flex items-center gap-2 self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Experience
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {["all", "live", "draft", "unlisted"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-body-sm font-medium transition-all ${
                filter === f
                  ? "bg-[#FF0F73] text-white"
                  : "bg-white/5 text-[#64748B] hover:bg-white/10 hover:text-white border border-white/[0.08]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 118 0 4 4 0 01-8 0zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your listings..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm"
          />
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden animate-pulse">
              <div className="aspect-video bg-white/[0.02]" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-3/4 bg-white/[0.04] rounded" />
                <div className="h-4 w-1/2 bg-white/[0.04] rounded" />
                <div className="h-4 w-1/4 bg-white/[0.04] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400 text-body-sm mb-3">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredExperiences.length === 0 && experiences.length === 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-white/10 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <p className="text-body-sm text-[#64748B] mb-4">You haven't created any experiences yet.</p>
          <Link
            href="/partner/menu/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all"
          >
            Create Your First Experience
          </Link>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && !error && filteredExperiences.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiences.map((exp) => {
            const statusConfig = getStatusConfig(exp.status);
            return (
              <Link
                key={exp.id}
                href={`/partner/listings/${exp.id}`}
                className="group rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden hover:border-[#FF0F73]/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-200"
              >
                <div className="relative aspect-video">
                  {exp.images.length > 0 ? (
                    <img
                      src={exp.images[0]}
                      alt={exp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FF0F73]/20 to-[#FF7A1A]/20 flex items-center justify-center">
                      <span className="text-4xl">{exp.category === "Date" ? "💕" : exp.category === "Chill" ? "🌿" : exp.category === "Celebrate" ? "🎉" : "🌄"}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold border ${statusConfig.className}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="text-body-lg font-bold text-white line-clamp-1 group-hover:text-[#FF0F73] transition-colors">{exp.title}</h3>
                  <div className="flex items-center gap-2 text-caption text-[#64748B]">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    <span className="truncate">{exp.location}</span>
                  </div>
                  {exp.rating > 0 && (
                    <div className="flex items-center gap-2 text-caption">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium text-white">{exp.rating.toFixed(1)}</span>
                      <span className="text-[#64748B]">({exp.review_count} reviews)</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-heading-sm font-bold text-white">MK {exp.price.toLocaleString()}</span>
                    <span className="text-caption text-[#64748B]">/ person</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                    <Link
                      href={`/partner/listings/${exp.id}`}
                      className="flex-1 px-3 py-2 rounded-xl border border-white/[0.08] text-white/80 font-medium text-body-sm hover:bg-white/5 text-center transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      Edit
                    </Link>
                    <a
                      href={`/partner/listings/${exp.id}/settings`}
                      className="p-2 rounded-xl hover:bg-white/5 transition-colors text-[#64748B] hover:text-white"
                      onClick={(e) => e.preventDefault()}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106a1.532 1.532 0 01.947 2.287c-.38 1.56.38 3.18 1.56 3.18a1.532 1.532 0 01-.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c1.56.38 3.18-.38 3.18-1.56a1.532 1.532 0 01.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* No results for filter */}
      {!loading && !error && filteredExperiences.length === 0 && experiences.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-12 text-center">
          <p className="text-body-sm text-[#64748B]">No listings match your current filter</p>
        </div>
      )}
    </div>
  );
}