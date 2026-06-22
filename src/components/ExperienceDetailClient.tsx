"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Experience } from "@/lib/types";
import { moods } from "@/lib/data";
import ContentRail from "./ContentRail";
import AuthModal from "./AuthModal";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    <div className="bg-[#111827] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors text-[#A1A1AA]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-body-sm font-semibold text-white">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors text-[#A1A1AA]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-caption text-[#6B7280] font-medium py-1">{d}</div>
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
                  ? "bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white"
                  : disabled
                    ? "text-[#6B7280]/30 line-through cursor-not-allowed"
                    : "text-[#A1A1AA] hover:bg-white/[0.06] hover:text-white"
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

function GuestSelector({ value, onChange, maxGuests }: { value: number; onChange: (v: number) => void; maxGuests: number }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.08)]">
      <span className="text-body-sm text-white font-medium">Guests</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        </button>
        <span className="w-6 text-center text-body font-semibold text-white">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          disabled={value >= maxGuests}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
    </div>
  );
}

interface Props {
  experience: Experience;
  similarExperiences: Experience[];
}

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
    if (!token) {
      setAuthOpen(true);
      return;
    }

    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          experience_id: exp.id,
          guests_count: guests,
          total_price: exp.price * guests,
          experience_date: selectedDate.toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookedDate(selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
        setBookingDone(true);
      }
    } catch (e) {
      console.error("Booking failed", e);
    } finally {
      setBooking(false);
    }
  };

  const gotoNearby = () => {
    window.location.href = "/experiences?nearby=true";
  };

  if (bookingDone) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center mx-auto mb-6 shadow-[0_8px_32px_rgba(255,45,122,0.3)]">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-display-sm font-bold text-white mb-3">Booking Confirmed!</h1>
          <p className="text-[#A1A1AA] text-body-lg mb-2">{exp.title}</p>
          <p className="text-body-sm text-[#6B7280] mb-1">{bookedDate} · {guests} guest{guests > 1 ? "s" : ""}</p>
          <p className="text-heading-md font-bold text-white mb-8">MK {(exp.price * guests).toLocaleString()}</p>
          <p className="text-caption text-[#6B7280] mb-8">Check your email for the full confirmation and receipt.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/bookings" className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all">
              View My Bookings
            </Link>
            <Link href="/" className="px-8 py-3 rounded-xl bg-[#111827] text-white font-semibold text-body-sm border border-[rgba(255,255,255,0.08)] hover:bg-[#1a2235] transition-all">
              Discover More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {/* ─── Hero Image Gallery ─── */}
      <section className="relative">
        <div className="relative h-[50vh] sm:h-[65vh] md:h-[75vh]">
          {exp.images.map((img, i) => (
            <Image
              key={i}
              src={img}
              alt={`${exp.title} - Image ${i + 1}`}
              fill
              className={`object-cover transition-opacity duration-500 ${i === activeImage ? "opacity-100" : "opacity-0"}`}
              sizes="100vw"
              priority={i === 0}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

          <Link
            href="/experiences"
            className="absolute top-20 left-4 sm:left-8 px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-md text-white text-body-sm border border-white/[0.08] hover:bg-white/[0.12] transition-colors z-10"
          >
            ← Back
          </Link>
        </div>

        <div className="absolute bottom-4 left-4 sm:left-8 right-4 sm:right-8 z-10">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {exp.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  i === activeImage ? "border-[#FF2D7A] ring-1 ring-[#FF2D7A]/50" : "border-white/20 hover:border-white/50"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Desktop Layout ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:grid lg:grid-cols-3 lg:gap-10 relative -mt-24 z-20">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-[#0A101B] rounded-2xl border border-[rgba(255,255,255,0.08)] p-5 sm:p-8 mb-6">
            {/* Mood Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {exp.mood.map((m) => {
                const moodData = moods.find((md) => md.label === m);
                return (
                  <span key={m} className="px-3 py-1 rounded-full bg-[#111827] text-caption text-[#A1A1AA] border border-[rgba(255,255,255,0.06)]">
                    {moodData?.emoji} {m}
                  </span>
                );
              })}
            </div>

            <h1 className="text-display-sm font-bold text-white mb-1">{exp.title}</h1>
            <p className="text-[#A1A1AA] text-heading-md mb-5">{exp.subtitle}</p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6">
              <div className="flex items-center gap-1.5 text-body-sm text-[#A1A1AA]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {exp.location}
                <span className="text-[#6B7280]">·</span>
                <span className="text-[#6B7280]">{exp.city}</span>
                {exp.distance && (
                  <>
                    <span className="text-[#6B7280]">·</span>
                    <span className="text-[#6B7280]">{exp.distance}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-body-sm text-[#A1A1AA]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {exp.duration}
              </div>
              <div className="flex items-center gap-1.5 text-body-sm">
                <span className="text-yellow-400">★</span>
                <span className="text-white font-medium">{exp.rating}</span>
                <span className="text-[#6B7280]">({exp.reviewCount} reviews)</span>
              </div>
            </div>

            <div className="lg:hidden flex items-center justify-between p-4 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.08)] mb-6">
              <div>
                <p className="text-caption text-[#6B7280]">From</p>
                <p className="text-heading-lg font-bold text-white">MK {exp.price.toLocaleString()}</p>
                <p className="text-caption text-[#6B7280]">per person</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-caption text-[#6B7280]">Guests:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1} className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white text-sm disabled:opacity-30">−</button>
                    <span className="w-5 text-center text-body-sm text-white font-medium">{guests}</span>
                    <button onClick={() => setGuests(Math.min(exp.capacity, guests + 1))} disabled={guests >= exp.capacity} className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white text-sm disabled:opacity-30">+</button>
                  </div>
                </div>
                <button
                  onClick={handleBookNow}
                  disabled={!selectedDate || booking}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking ? "Booking..." : selectedDate ? "Book Now" : "Select Date"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.08)] mb-8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center text-white font-bold text-body-sm flex-shrink-0">
                {exp.partner.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="text-caption text-[#6B7280]">Hosted by</p>
                <p className="text-body-sm font-semibold text-white">{exp.partner}</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-heading-md font-bold text-white mb-3">About this experience</h2>
              <p className="text-[#A1A1AA] text-body leading-relaxed">{exp.description}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-heading-md font-bold text-white mb-4">What&apos;s included</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {exp.includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.06)]">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-body-sm text-[#A1A1AA]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="mb-8">
              <h2 className="text-heading-md font-bold text-white mb-4">
                Reviews <span className="text-[#6B7280]">({exp.reviews.length})</span>
              </h2>
              <div className="space-y-4">
                {exp.reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Image src={review.avatar} alt={review.author} width={36} height={36} className="rounded-full bg-[#1a2235]" />
                        <div>
                          <p className="text-body-sm font-semibold text-white">{review.author}</p>
                          <p className="text-caption text-[#6B7280]">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`w-4 h-4 ${star <= Math.round(review.rating) ? "text-yellow-400" : "text-[#6B7280]/30"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-body-sm text-[#A1A1AA] leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="mb-8">
              <h2 className="text-heading-md font-bold text-white mb-4">Location</h2>
              <div className="rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] h-64 relative">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${exp.coordinates.lng - 0.05}%2C${exp.coordinates.lat - 0.05}%2C${exp.coordinates.lng + 0.05}%2C${exp.coordinates.lat + 0.05}&layer=mapnik&marker=${exp.coordinates.lat}%2C${exp.coordinates.lng}`}
                  className="w-full h-full border-0"
                  title="Location map"
                  loading="lazy"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-caption text-[#A1A1AA] border border-white/[0.08]">
                  📍 {exp.location} · {exp.city}
                </div>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSaved(!saved)}
                  className={`px-4 py-3 rounded-xl border transition-all text-body-sm font-medium ${
                    saved
                      ? "border-[#FF2D7A] text-[#FF2D7A] bg-[#FF2D7A]/10"
                      : "border-[rgba(255,255,255,0.08)] text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {saved ? "♥ Saved" : "♡ Save"}
                </button>
                <Link
                  href={`/gift?exp=${exp.id}`}
                  className="px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#A1A1AA] text-body-sm font-medium text-center hover:bg-white/[0.04] hover:text-white transition-all"
                >
                  🎁 Gift
                </Link>
                <button
                  onClick={handleShare}
                  className="px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#A1A1AA] text-body-sm font-medium hover:bg-white/[0.04] hover:text-white transition-all"
                >
                  {shareFeedback ? "✓ Copied" : "↗ Share"}
                </button>
              </div>
              <button onClick={gotoNearby} className="text-body-sm text-[#6B7280] hover:text-[#A1A1AA] transition-colors text-center py-2">
                Find experiences near {exp.location}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Sticky Booking Sidebar ─── */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <div className="bg-[#0A101B] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6">
              <div className="mb-5">
                <p className="text-heading-lg font-bold text-white">
                  MK {exp.price.toLocaleString()}
                </p>
                <p className="text-caption text-[#6B7280]">per person</p>
              </div>

              <div className="mb-4">
                <p className="text-body-sm font-semibold text-white mb-3">Select date</p>
                <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
              </div>

              <div className="mb-6">
                <GuestSelector value={guests} onChange={setGuests} maxGuests={exp.capacity} />
              </div>

              <div className="flex items-center justify-between mb-5 p-3 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.06)]">
                <span className="text-body-sm text-[#A1A1AA]">Total</span>
                <span className="text-heading-sm font-bold text-white">
                  MK {(exp.price * guests).toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleBookNow}
                disabled={!selectedDate || booking}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              <div className="grid grid-cols-3 gap-2 mt-3">
                <button
                  onClick={() => setSaved(!saved)}
                  className={`py-2.5 rounded-xl border transition-all text-caption font-medium ${
                    saved
                      ? "border-[#FF2D7A] text-[#FF2D7A] bg-[#FF2D7A]/10"
                      : "border-[rgba(255,255,255,0.08)] text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {saved ? "♥" : "♡"}
                </button>
                <Link
                  href={`/gift?exp=${exp.id}`}
                  className="py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#A1A1AA] text-caption font-medium text-center hover:bg-white/[0.04] hover:text-white transition-all"
                >
                  🎁
                </Link>
                <button
                  onClick={handleShare}
                  className="py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#A1A1AA] text-caption font-medium hover:bg-white/[0.04] hover:text-white transition-all"
                >
                  {shareFeedback ? "✓" : "↗"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Similar Experiences ─── */}
      <div className="mt-8">
        <ContentRail title="Similar Experiences" experiences={similarExperiences} viewAllHref="/experiences" />
      </div>
    </div>
  );
}