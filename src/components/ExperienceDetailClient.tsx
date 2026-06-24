"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Experience } from "@/lib/types";
import { trackView, trackBooked, trackSaved } from "@/lib/recommendations";

import ContentRail from "./ContentRail";
import AuthModal from "./AuthModal";

// ─── Constants ───
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Star Rating Display ───
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${cls} ${star <= Math.round(rating) ? "text-yellow-400" : "text-[#e0e0e0]"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Calendar ───
function Calendar({ selectedDate, onSelect }: { selectedDate: Date | null; onSelect: (d: Date) => void }) {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const unavailable = useMemo(() => {
    const set = new Set<number>();
    for (let d = 1; d <= daysInMonth; d++) {
      if ((d * 7 + month * 13 + year * 31) % 10 > 6) set.add(d);
    }
    return set;
  }, [daysInMonth, month, year]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const isPast = (d: number) =>
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth()) ||
    (year === today.getFullYear() && month === today.getMonth() && d < today.getDate());

  const cells: (number | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-xl p-4 border border-[#ebebeb] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#FFF8F0] transition-colors text-[#6a6a6a]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-body-sm font-semibold text-[#222222]">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#FFF8F0] transition-colors text-[#6a6a6a]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-caption text-[#929292] font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />;
          const disabled = isPast(d) || unavailable.has(d);
          const selected = selectedDate?.getDate() === d && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
          return (
            <button
              key={d}
              disabled={disabled}
              onClick={() => onSelect(new Date(year, month, d))}
              className={`w-full aspect-square rounded-lg text-caption font-medium flex items-center justify-center transition-all ${
                selected
                  ? "bg-[#ff385c] text-white shadow-[0_2px_8px_rgba(255,56,92,0.25)]"
                  : disabled
                    ? "text-[#929292]/30 line-through cursor-not-allowed"
                    : "text-[#6a6a6a] hover:bg-[#FFF8F0] hover:text-[#222222]"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── GuestSelector ───
function GuestSelector({ value, onChange, maxGuests }: { value: number; onChange: (v: number) => void; maxGuests: number }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#ebebeb]">
      <span className="text-body-sm text-[#222222] font-medium">Guests</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FFF8F0] text-[#222222] hover:bg-[#FFF0F3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        </button>
        <span className="w-6 text-center text-body font-semibold text-[#222222]">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          disabled={value >= maxGuests}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FFF8F0] text-[#222222] hover:bg-[#FFF0F3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Review Card ───
function ReviewCard({ review }: { review: Experience["reviews"][number] }) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Image src={review.avatar} alt={review.author} width={40} height={40} className="rounded-full bg-[#ebebeb] ring-2 ring-white" />
          <div>
            <p className="text-body-sm font-semibold text-[#222222]">{review.author}</p>
            <p className="text-caption text-[#929292]">{review.date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <p className="text-body-sm text-[#6a6a6a] leading-relaxed">{review.text}</p>
    </div>
  );
}

// ─── Props ───
interface Props {
  experience: Experience;
  similarExperiences: Experience[];
}

// ─── Main Component ───
export default function ExperienceDetailClient({ experience: exp, similarExperiences }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [saved, setSaved] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookedDate, setBookedDate] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [giftApplied, setGiftApplied] = useState(false);
  const [giftAmount, setGiftAmount] = useState(0);
  const [giftChecking, setGiftChecking] = useState(false);
  const [giftError, setGiftError] = useState("");

  // Track view on mount
  useEffect(() => { trackView(exp.id); }, [exp.id]);

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

  const handleBookNow = async () => {
    if (!selectedDate) return;
    const token = localStorage.getItem("momento-auth-token");
    if (!token) { setAuthOpen(true); return; }
    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          experience_id: exp.id,
          guests_count: guests,
          total_price: exp.price * guests,
          experience_date: selectedDate.toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        trackBooked(exp.id);
        setBookedDate(selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
        setBookingDone(true);
      }
    } catch (e) {
      console.error("Booking failed", e);
    } finally {
      setBooking(false);
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCode.trim()) return;
    setGiftChecking(true);
    setGiftError("");
    try {
      const token = localStorage.getItem("momento-auth-token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(giftCode)}`, { headers });
      const data = await res.json();
      if (res.ok && data) {
        const balance = data.balance || data.amount || 0;
        if (balance <= 0) { setGiftError("This gift card has no remaining balance"); return; }
        setGiftAmount(Math.min(balance, exp.price * guests));
        setGiftApplied(true);
      } else {
        setGiftError(data?.error || "Invalid gift card code");
      }
    } catch {
      setGiftError("Could not verify gift card. Please try again.");
    } finally {
      setGiftChecking(false);
    }
  };

  const gotoNearby = () => { window.location.href = "/experiences?nearby=true"; };

  // ─── Booking Confirmed State ───
  if (bookingDone) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center bg-ambient-warm">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 rounded-full bg-[#ff385c] flex items-center justify-center mx-auto mb-6 shadow-[0_4px_16px_rgba(255,56,92,0.2)]">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-display-sm font-bold text-[#222222] mb-3">Booking Confirmed!</h1>
          <p className="text-[#6a6a6a] text-body-lg mb-2">{exp.title}</p>
          <p className="text-body-sm text-[#929292] mb-1">{bookedDate} · {guests} guest{guests > 1 ? "s" : ""}</p>
          <p className="text-heading-md font-bold text-[#222222] mb-8">MK {(exp.price * guests).toLocaleString()}</p>
          <p className="text-caption text-[#929292] mb-8">Check your email for the full confirmation and receipt.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/bookings" className="px-8 py-3 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,56,92,0.25)] transition-all">
              View My Bookings
            </Link>
            <Link href="/" className="px-8 py-3 rounded-xl bg-white text-[#222222] font-semibold text-body-sm border border-[#ebebeb] hover:bg-[#FFF8F0] transition-all">
              Discover More
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  const totalPrice = exp.price * guests;
  const finalPrice = Math.max(0, totalPrice - giftAmount);

  // ─── Render ───
  return (
    <div className="bg-ambient-warm min-h-screen">
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* ════════════════════════════════════════════ */}
      {/* HERO GALLERY                                */}
      {/* ════════════════════════════════════════════ */}
      <section className="relative">
        <div className="relative h-[55vh] sm:h-[70vh] md:h-[80vh] overflow-hidden">
          {exp.images.map((img, i) => (
            <Image
              key={i}
              src={img}
              alt={`${exp.title} - Image ${i + 1}`}
              fill
              className={`object-cover transition-all duration-700 ease-out ${i === activeImage ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
              sizes="100vw"
              priority={i === 0}
            />
          ))}
          {/* Overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070B]/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

          {/* Top bar: Back + Save + Share */}
          <div className="absolute top-20 left-4 sm:left-8 right-4 sm:right-8 flex items-start justify-between z-10">
            <Link
              href="/experiences"
              className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-md text-[#222222] text-body-sm font-medium border border-[#ebebeb] hover:bg-white transition-all shadow-sm"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { trackSaved(exp.id, !saved); setSaved(!saved); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all shadow-sm ${
                  saved
                    ? "bg-[#ff385c] text-white border-[#ff385c]"
                    : "bg-white/90 text-[#222222] border-[#ebebeb] hover:bg-white"
                }`}
                aria-label={saved ? "Unsave" : "Save"}
              >
                <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-[#222222] border border-[#ebebeb] hover:bg-white transition-all flex items-center justify-center shadow-sm"
                aria-label="Share"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* "Show all photos" button */}
          {exp.images.length > 5 && (
            <button
              onClick={() => setActiveImage(0)}
              className="absolute bottom-24 right-4 sm:right-8 z-10 px-4 py-2 rounded-lg bg-white/90 backdrop-blur-md text-[#222222] text-caption font-medium border border-[#ebebeb] hover:bg-white transition-all shadow-sm"
            >
              Show all {exp.images.length} photos
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="absolute bottom-4 left-4 sm:left-8 right-4 sm:right-8 z-10">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {exp.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  i === activeImage
                    ? "border-white ring-2 ring-white/60 shadow-lg"
                    : "border-white/50 hover:border-white"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* MAIN LAYOUT: Content + Sidebar              */}
      {/* ════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:grid lg:grid-cols-3 lg:gap-10 relative -mt-8 sm:-mt-12 lg:-mt-16 z-20">

        {/* ─── LEFT COLUMN: Content ─── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#ebebeb] p-5 sm:p-8 mb-6 shadow-sm">
            {/* Mood Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {exp.mood.map((m) => (
                <span key={m} className="px-3 py-1 rounded-full bg-[#FFF0F3] text-caption text-[#6a6a6a] border border-[#ebebeb] font-medium">
                  {m}
                </span>
              ))}
            </div>

            {/* Title + Subtitle */}
            <h1 className="text-display-sm font-bold text-[#222222] mb-1 leading-tight">{exp.title}</h1>
            <p className="text-[#6a6a6a] text-heading-md mb-5">{exp.subtitle}</p>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 pb-6 border-b border-[#ebebeb]">
              <div className="flex items-center gap-1.5 text-body-sm text-[#6a6a6a]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {exp.location}
                {exp.city && <><span className="text-[#929292]">·</span><span className="text-[#929292]">{exp.city}</span></>}
                {exp.distance && <><span className="text-[#929292]">·</span><span className="text-[#929292]">{exp.distance}</span></>}
              </div>
              <div className="flex items-center gap-1.5 text-body-sm text-[#6a6a6a]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {exp.duration}
              </div>
              <div className="flex items-center gap-1.5 text-body-sm">
                <span className="text-yellow-400">★</span>
                <span className="text-[#222222] font-semibold">{exp.rating}</span>
                <span className="text-[#929292]">({exp.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Mobile: Quick Booking Summary */}
            <div className="lg:hidden flex items-center justify-between p-4 rounded-xl bg-white border border-[#ebebeb] mb-6 shadow-sm">
              <div>
                <p className="text-caption text-[#929292]">From</p>
                <p className="text-heading-lg font-bold text-[#222222]">MK {exp.price.toLocaleString()}</p>
                <p className="text-caption text-[#929292]">per person</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-caption text-[#929292]">Guests:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1} className="w-7 h-7 rounded-full bg-[#FFF8F0] flex items-center justify-center text-[#222222] text-sm disabled:opacity-30 hover:bg-[#FFF0F3]">−</button>
                    <span className="w-5 text-center text-body-sm text-[#222222] font-medium">{guests}</span>
                    <button onClick={() => setGuests(Math.min(exp.capacity, guests + 1))} disabled={guests >= exp.capacity} className="w-7 h-7 rounded-full bg-[#FFF8F0] flex items-center justify-center text-[#222222] text-sm disabled:opacity-30 hover:bg-[#FFF0F3]">+</button>
                  </div>
                </div>
                <button
                  onClick={handleBookNow}
                  disabled={!selectedDate || booking}
                  className="px-6 py-2.5 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,56,92,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking ? "Booking..." : selectedDate ? "Book Now" : "Select Date"}
                </button>
              </div>
            </div>

            {/* Host Section */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#ebebeb] mb-6 shadow-sm hover:bg-[#FFF8F0] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff385c] to-[#FF7A18] flex items-center justify-center text-white font-bold text-body-sm flex-shrink-0 shadow-sm">
                  {exp.partner.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="text-caption text-[#929292]">Hosted by</p>
                  <p className="text-body-sm font-semibold text-[#222222]">{exp.partner}</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl border border-[#ebebeb] text-body-sm font-medium text-[#222222] hover:bg-white hover:border-[#dddddd] transition-all">
                Message
              </button>
            </div>

            {/* About */}
            <div className="mb-6">
              <h2 className="text-heading-md font-bold text-[#222222] mb-3">About this experience</h2>
              <p className="text-[#6a6a6a] text-body leading-relaxed">{exp.description}</p>
            </div>

            {/* What's Included */}
            <div className="mb-6">
              <h2 className="text-heading-md font-bold text-[#222222] mb-4">What&apos;s included</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {exp.includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#FFF8F0] border border-[#ebebeb]">
                    <div className="w-5 h-5 rounded-full bg-[#ff385c] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-body-sm text-[#6a6a6a]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Reviews Section ═══ */}
            <div className="mb-6 pt-4 border-t border-[#ebebeb]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-heading-md font-bold text-[#222222] flex items-center gap-2">
                  <span className="text-yellow-400 text-heading">★</span>
                  <span>{exp.rating}</span>
                  <span className="text-[#929292] font-normal text-body-sm">· {exp.reviews.length} reviews</span>
                </h2>
              </div>

              {/* Star Breakdown Bars */}
              <div className="space-y-2 mb-6 p-4 rounded-xl bg-[#FFF8F0] border border-[#ebebeb]">
                {ratingBreakdown.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-caption font-medium text-[#6a6a6a] w-6 text-right">{star}</span>
                    <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 h-2 rounded-full bg-[#ebebeb] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#ff385c] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-caption text-[#929292] w-8">{count}</span>
                  </div>
                ))}
              </div>

              {/* Review Cards */}
              <div className="space-y-4">
                {exp.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>

              {exp.reviews.length === 0 && (
                <div className="text-center py-8 text-[#929292] text-body-sm">
                  No reviews yet. Be the first to share your experience!
                </div>
              )}

              <button className="mt-4 px-6 py-2.5 rounded-xl border border-[#ebebeb] text-body-sm font-medium text-[#222222] hover:bg-[#FFF8F0] hover:border-[#dddddd] transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Write a Review
              </button>
            </div>

            {/* Map */}
            <div className="mb-6 pt-4 border-t border-[#ebebeb]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading-md font-bold text-[#222222]">Location</h2>
                <button onClick={gotoNearby} className="text-body-sm text-[#ff385c] font-medium hover:text-[#e00b41] transition-colors">
                  Find nearby
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-[#ebebeb] h-64 relative shadow-sm">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${exp.coordinates.lng - 0.05}%2C${exp.coordinates.lat - 0.05}%2C${exp.coordinates.lng + 0.05}%2C${exp.coordinates.lat + 0.05}&layer=mapnik&marker=${exp.coordinates.lat}%2C${exp.coordinates.lng}`}
                  className="w-full h-full border-0"
                  title="Location map"
                  loading="lazy"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md text-caption text-[#6a6a6a] border border-[#ebebeb] shadow-sm">
                  📍 {exp.location} · {exp.city}
                </div>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex flex-col gap-3 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { trackSaved(exp.id, !saved); setSaved(!saved); }}
                  className={`px-4 py-3 rounded-xl border transition-all text-body-sm font-medium ${
                    saved
                      ? "border-[#ff385c] text-[#ff385c] bg-[#ff385c]/10"
                      : "border-[#ebebeb] text-[#6a6a6a] hover:bg-[#FFF8F0] hover:text-[#222222]"
                  }`}
                >
                  {saved ? "♥ Saved" : "♡ Save"}
                </button>
                <Link
                  href={`/gift?exp=${exp.id}`}
                  className="px-4 py-3 rounded-xl border border-[#ebebeb] text-[#6a6a6a] text-body-sm font-medium text-center hover:bg-[#FFF8F0] hover:text-[#222222] transition-all"
                >
                  🎁 Gift
                </Link>
                <button
                  onClick={handleShare}
                  className="px-4 py-3 rounded-xl border border-[#ebebeb] text-[#6a6a6a] text-body-sm font-medium hover:bg-[#FFF8F0] hover:text-[#222222] transition-all"
                >
                  {shareFeedback ? "✓ Copied" : "↗ Share"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Sticky Booking Sidebar ─── */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-sm hover:shadow-md transition-shadow duration-300">
              {/* Price Header */}
              <div className="p-6 pb-4 border-b border-[#ebebeb]">
                <div className="flex items-baseline gap-1">
                  <span className="text-heading-lg font-bold text-[#222222]">MK {exp.price.toLocaleString()}</span>
                  <span className="text-caption text-[#929292]">/ person</span>
                </div>
              </div>

              <div className="p-6 pt-4 space-y-4">
                {/* Calendar */}
                <div>
                  <p className="text-body-sm font-semibold text-[#222222] mb-2">Select date</p>
                  <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
                </div>

                {/* Guest Selector */}
                <GuestSelector value={guests} onChange={setGuests} maxGuests={exp.capacity} />

                {/* Gift Card */}
                <div className="p-3 rounded-xl bg-[#FFF8F0] border border-[#ebebeb]">
                  <p className="text-caption font-semibold text-[#4a4a4a] mb-2 uppercase tracking-wider">Gift Card</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="MOMO-XXXXXXXX"
                      value={giftCode}
                      onChange={(e) => { setGiftCode(e.target.value.toUpperCase()); setGiftApplied(false); setGiftError(""); }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#ebebeb] text-[#222222] text-caption font-mono placeholder:text-[#929292] focus:outline-none focus:border-[#ff385c] transition-all"
                      disabled={giftApplied}
                    />
                    {giftApplied ? (
                      <button
                        onClick={() => { setGiftApplied(false); setGiftCode(""); setGiftAmount(0); setGiftError(""); }}
                        className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-caption font-semibold border border-emerald-200 hover:bg-emerald-100 transition-all whitespace-nowrap"
                      >
                        ✓ Applied
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyGiftCard}
                        disabled={!giftCode.trim() || giftChecking}
                        className="px-3 py-2 rounded-lg bg-[#ff385c] text-white text-caption font-semibold hover:bg-[#e00b41] transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {giftChecking ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : "Apply"}
                      </button>
                    )}
                  </div>
                  {giftError && <p className="text-caption text-red-500 mt-1.5">{giftError}</p>}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-body-sm text-[#6a6a6a]">
                    <span>MK {exp.price.toLocaleString()} × {guests} {guests === 1 ? "guest" : "guests"}</span>
                    <span>MK {totalPrice.toLocaleString()}</span>
                  </div>
                  {giftApplied && giftAmount > 0 && (
                    <div className="flex items-center justify-between text-body-sm text-emerald-600">
                      <span>Gift card discount</span>
                      <span>-MK {giftAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F0] border border-[#ebebeb]">
                    <span className="text-body-sm font-semibold text-[#222222]">Total</span>
                    <span className="text-heading-sm font-bold text-[#222222]">MK {finalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Book Now */}
                <button
                  onClick={handleBookNow}
                  disabled={!selectedDate || booking}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff385c] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,56,92,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {booking ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Booking...
                    </>
                  ) : selectedDate ? (
                    "Book Now"
                  ) : (
                    "Select a date"
                  )}
                </button>

                <p className="text-caption text-[#929292] text-center">You won&apos;t be charged yet</p>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                onClick={() => { trackSaved(exp.id, !saved); setSaved(!saved); }}
                    className={`py-2.5 rounded-xl border transition-all text-caption font-medium flex items-center justify-center gap-1 ${
                      saved
                        ? "border-[#ff385c] text-[#ff385c] bg-[#ff385c]/10"
                        : "border-[#ebebeb] text-[#6a6a6a] hover:bg-[#FFF8F0] hover:text-[#222222]"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Save
                  </button>
                  <Link
                    href={`/gift?exp=${exp.id}`}
                    className="py-2.5 rounded-xl border border-[#ebebeb] text-[#6a6a6a] text-caption font-medium text-center hover:bg-[#FFF8F0] hover:text-[#222222] transition-all flex items-center justify-center gap-1"
                  >
                    🎁 Gift
                  </Link>
                  <button
                    onClick={handleShare}
                    className="py-2.5 rounded-xl border border-[#ebebeb] text-[#6a6a6a] text-caption font-medium hover:bg-[#FFF8F0] hover:text-[#222222] transition-all flex items-center justify-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            </div>
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
