"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Experience, Review } from "@/lib/types";
import { trackView, trackBooked, trackSaved } from "@/lib/recommendation-engine";

import ReviewCard from "./ReviewCard";
import ContentRail from "./ContentRail";
import AuthModal from "./AuthModal";
import ReviewForm from "./ReviewForm";
import LocationMap from "./LocationMap";

// ─── Props ───
interface Props {
  experience: Experience;
  similarExperiences: Experience[];
}

// ─── Collapsible Section ───
function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.08] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <h2 className="text-base font-bold text-white">{title}</h2>
        <svg
          className={`w-4 h-4 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[2000px] opacity-100 pb-4" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function ExperienceDetailClient({ experience: exp, similarExperiences }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSort, setReviewSort] = useState<"recent" | "highest" | "lowest">("recent");
  const router = useRouter();

  // Track view on mount
  useEffect(() => { trackView(exp.id); }, [exp.id]);

  // Load local reviews and merge with exp.reviews
  const allReviews = useMemo(() => {
    const local: Review[] = [];
    try {
      const key = `EXPERIO-reviews-${exp.id}`;
      const raw = localStorage.getItem(key);
      if (raw) local.push(...JSON.parse(raw));
    } catch { /* ignore */ }
    return [...local, ...exp.reviews];
  }, [exp.id, exp.reviews]);

  const sortedReviews = useMemo(() => {
    const sorted = [...allReviews];
    switch (reviewSort) {
      case "recent":  sorted.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); break;
      case "highest": sorted.sort((a, b) => b.rating - a.rating); break;
      case "lowest":  sorted.sort((a, b) => a.rating - b.rating); break;
    }
    return sorted;
  }, [allReviews, reviewSort]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: exp.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      });
    }
  }, [exp.title]);

  const handleMessage = async () => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) { setAuthOpen(true); return; }

    const hostUserId = typeof exp.partner === 'object' && exp.partner !== null ? (exp.partner as any).user_id : null;
    if (!hostUserId) return;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          participant_id: hostUserId,
          experience_id: exp.id,
          initial_message: `Hi! I'm interested in "${exp.title}" and would like to know more.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/messages?conversation=${data.id}`);
      }
    } catch { /* silent */ }
  };

  const handleBookNow = () => {
    const params = new URLSearchParams({ experience_id: exp.id });
    router.push(`/checkout?${params.toString()}`);
  };

  const gotoNearby = () => { router.push("/experiences?nearby=true"); };

  // ─── Ratings Breakdown ───
  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    exp.reviews.forEach((r) => {
      const k = Math.round(r.rating) as keyof typeof counts;
      if (k >= 1 && k <= 5) counts[k]++;
    });
    const total = exp.reviews.length || 1;
    return Object.entries(counts)
      .reverse()
      .map(([star, count]) => ({ star: Number(star), count, pct: (count / total) * 100 }));
  }, [exp.reviews]);

  // ─── Render ───
  return (
    <div className="bg-[#05070B] min-h-screen">
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* ════════════════════════════════════════════ */}
      {/* HERO GALLERY                                */}
      {/* ════════════════════════════════════════════ */}
      <section id="hero-gallery" className="relative">
        <div className="relative h-[55vh] sm:h-[70vh] md:h-[80vh] overflow-hidden">
          {exp.images.slice(0, 5).map((img, i) => (
            <Image
              key={i}
              src={img}
              alt={`${exp.title} - Image ${i + 1}`}
              fill
              className={`object-cover transition-all duration-700 ease-out ${i === activeImage ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"}`}
              sizes="100vw"
              priority={i === 0}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070B]/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

          {/* Top bar: Back + Save + Share */}
          <div className="absolute top-20 left-4 sm:left-8 right-4 sm:right-8 flex items-start justify-between z-10">
            <Link
              href="/experiences"
              className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium border border-white/[0.15] hover:bg-white/20 transition-all"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { trackSaved(exp.id, !saved); setSaved(!saved); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                  saved
                    ? "bg-[#FF0F73] text-white border-[#FF0F73]"
                    : "bg-white/10 text-white border-white/[0.15] hover:bg-white/20"
                }`}
                aria-label={saved ? "Unsave" : "Save"}
              >
                <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/[0.15] hover:bg-white/20 transition-all flex items-center justify-center"
                aria-label="Share"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="absolute bottom-4 left-4 sm:left-8 right-4 sm:right-8 z-30 pointer-events-none">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 pointer-events-auto">
            {exp.images.slice(0, 5).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  i === activeImage
                    ? "border-white ring-2 ring-white/60 shadow-lg"
                    : "border-white/50 hover:border-white"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover pointer-events-none" sizes="80px" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* MAIN CONTENT                                */}
      {/* ════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative -mt-8 sm:-mt-8 z-20">
        <div className="max-w-4xl mx-auto">
          {/* ─── Title Card ─── */}
          <div className="rounded-2xl border border-white/[0.1] p-5 sm:p-8 mb-6 bg-[#111827]">
            {/* Mood Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {exp.mood.map((m) => (
                <span key={m} className="px-3 py-1 rounded-full bg-white/[0.06] text-xs text-white/50 border border-white/[0.1] font-medium">
                  {m}
                </span>
              ))}
            </div>

            {/* Title + Subtitle */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight">{exp.title}</h1>
            <p className="text-white/60 text-lg mb-5">{exp.subtitle}</p>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 pb-6 border-b border-white/[0.1]">
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {exp.location}
                {exp.city && <><span className="text-white/30">·</span><span className="text-white/40">{exp.city}</span></>}
                {exp.distance && <><span className="text-white/30">·</span><span className="text-white/40">{exp.distance}</span></>}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {exp.duration}
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-yellow-400">★</span>
                <span className="text-white font-semibold">{exp.rating}</span>
                <span className="text-white/40">({exp.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-white/40">From</p>
                <p className="text-2xl font-bold text-white">MK {exp.price.toLocaleString()}</p>
                <p className="text-xs text-white/40">per person</p>
              </div>
              <button
                onClick={handleBookNow}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-sm hover:shadow-[0_4px_24px_rgba(255,15,115,0.3)] transition-all duration-300 active:scale-[0.98]"
              >
                Book Now
              </button>
            </div>

            {/* Secondary Actions: Save, Gift, Share */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                onClick={() => { trackSaved(exp.id, !saved); setSaved(!saved); }}
                className={`py-2.5 rounded-xl border transition-all text-xs font-medium flex items-center justify-center gap-1.5 ${
                  saved
                    ? "border-[#FF0F73] text-[#FF0F73] bg-[#FF0F73]/10"
                    : "border-white/[0.1] text-white/50 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {saved ? "Saved" : "Save"}
              </button>
              <Link
                href={`/gift?exp=${exp.id}`}
                className="py-2.5 rounded-xl border border-white/[0.1] text-white/50 text-xs font-medium text-center hover:bg-white/5 hover:text-white/70 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="text-sm">🎁</span>
                Gift
              </Link>
              <button
                onClick={handleShare}
                className="py-2.5 rounded-xl border border-white/[0.1] text-white/50 text-xs font-medium hover:bg-white/5 hover:text-white/70 transition-all flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {shareFeedback ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* ─── Content Card ─── */}
          <div className="rounded-2xl border border-white/[0.1] p-5 sm:p-8 mb-6 bg-[#111827]">
            {/* Host Section */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {exp.partner.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="text-xs text-white/40">Hosted by</p>
                  <p className="text-sm font-semibold text-white">{exp.partner}</p>
                  {exp.partnerJoinedAt && (
                    <p className="text-xs text-white/30 mt-0.5">Joined {new Date(exp.partnerJoinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleMessage}
                className="px-4 py-2 rounded-xl border border-white/[0.1] text-xs font-medium text-white hover:bg-white/5 transition-all"
              >
                Message
              </button>
            </div>

            {/* About */}
            <div className="mb-4">
              <h2 className="text-base font-bold text-white mb-3">About this experience</h2>
              <p className="text-white/60 text-sm leading-relaxed">{exp.description}</p>
            </div>

            {/* Collapsible: What's Included */}
            {exp.includes.length > 0 && (
              <CollapsibleSection title={`What's included (${exp.includes.length})`}>
                <div className="grid sm:grid-cols-2 gap-2">
                  {exp.includes.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm text-white/60">{item}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Collapsible: What's Not Included */}
            {exp.excludes && exp.excludes.length > 0 && (
              <CollapsibleSection title={`What's not included (${exp.excludes.length})`}>
                <div className="grid sm:grid-cols-2 gap-2">
                  {exp.excludes.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </div>
                      <span className="text-sm text-white/60">{item}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Collapsible: Itinerary */}
            {exp.itinerary && exp.itinerary.length > 0 && (
              <CollapsibleSection title={`Itinerary (${exp.itinerary.length} stops)`}>
                <div className="space-y-3">
                  {exp.itinerary.map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex-shrink-0 w-16 text-right text-xs text-white/30 font-mono">
                        {item.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-white/50 mt-0.5">{item.description}</p>
                        {item.location && (
                          <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {item.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* ═══ Reviews Section ═══ */}
          <div className="rounded-2xl border border-white/[0.1] p-5 sm:p-8 mb-6 bg-[#111827]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-yellow-400">★</span>
                <span>{exp.rating}</span>
                <span className="text-white/40 font-normal text-sm">· {allReviews.length} reviews</span>
              </h2>
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
                {([["recent", "Recent"], ["highest", "Highest"], ["lowest", "Lowest"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setReviewSort(key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      reviewSort === key
                        ? "bg-[#FF0F73]/20 text-[#FF0F73]"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Star Breakdown */}
            <div className="space-y-2 mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {ratingBreakdown.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-white/40 w-6 text-right">{star}</span>
                  <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-[#FF0F73] transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-white/40 w-8">{count}</span>
                </div>
              ))}
            </div>

            {/* Review Cards */}
            <div className="space-y-4">
              {sortedReviews.map((review) => (
                <ReviewCard key={review.id} author={review.author} avatar={review.avatar} rating={review.rating} date={review.date} text={review.text} photos={review.photos} verified={review.verified} />
              ))}
            </div>

            {allReviews.length === 0 && (
              <div className="text-center py-8 text-white/40 text-sm">
                No reviews yet. Be the first to share your experience!
              </div>
            )}

            {showReviewForm ? (
              <div className="mt-4">
                <ReviewForm
                  experienceId={exp.id}
                  onSubmitted={() => setShowReviewForm(false)}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowReviewForm(true)}
                className="mt-4 px-6 py-2.5 rounded-xl border border-white/[0.1] text-sm font-medium text-white hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Write a Review
              </button>
            )}
          </div>

          {/* ═══ Map ═══ */}
          <div className="rounded-2xl border border-white/[0.1] p-5 sm:p-8 mb-6 bg-[#111827]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Location</h2>
              <button onClick={gotoNearby} className="text-sm text-[#FF0F73] font-medium hover:text-[#FF7A1A] transition-colors">
                Find nearby
              </button>
            </div>
            <LocationMap
              lat={exp.coordinates.lat}
              lng={exp.coordinates.lng}
              location={exp.location}
              city={exp.city}
            />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* SIMILAR EXPERIENCES                          */}
      {/* ════════════════════════════════════════════ */}
      <div className="mt-8 pb-12">
        <ContentRail
          title="Similar Experiences"
          experiences={similarExperiences}
          viewAllHref="/experiences"
        />
      </div>
    </div>
  );
}
