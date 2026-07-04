"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  title: string;
  bookedDate: string;
  guests: number;
  totalPrice: number;
  earnedPoints: number;
  tierUpgrade: string | null;
  experienceDate?: string; // ISO date for ICS
  location?: string;
  duration?: string;
  bookingRef?: string;
}

function generateICS({ title, date, location, description }: { title: string; date: string; location?: string; description?: string }) {
  const dtStart = new Date(date);
  const dtEnd = new Date(dtStart.getTime() + 2 * 60 * 60 * 1000); // assume 2h duration
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const escaped = (s: string) => s.replace(/[;,\\]/g, "\\$&").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Momento//Momento//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(dtStart)}`,
    `DTEND:${fmt(dtEnd)}`,
    `SUMMARY:${escaped(title)}`,
    location ? `LOCATION:${escaped(location)}` : "",
    description ? `DESCRIPTION:${escaped(description)}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function downloadICS(ics: string, filename: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BookingConfirmed({
  title,
  bookedDate,
  guests,
  totalPrice,
  earnedPoints,
  tierUpgrade,
  experienceDate,
  location,
  duration,
  bookingRef,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger mount animation sequence
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleAddToCalendar = () => {
    const ics = generateICS({
      title: `Momento: ${title}`,
      date: experienceDate || new Date().toISOString(),
      location,
      description: `${guests} guest${guests > 1 ? "s" : ""} · Ref: ${bookingRef || "N/A"}`,
    });
    downloadICS(ics, `MOMENTO-${title.replace(/\s+/g, "-").toLowerCase()}.ics`);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center bg-[#05070B]">
      {/* Confetti particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ["#FF0F73", "#FF7A1A", "#FFD700", "#22c55e", "#3b82f6", "#a855f7"][i % 6],
              animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-out ${0.3 + Math.random() * 0.8}s forwards`,
              opacity: 0,
              transform: `translateY(-20px) rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      <div
        className={`text-center max-w-md mx-auto px-4 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Animated checkmark */}
        <div className="w-20 h-20 rounded-full bg-[#FF0F73] flex items-center justify-center mx-auto mb-6 shadow-[0_4px_16px_rgba(255, 15, 115, 0.2)] animate-bounce-in">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-display-sm font-bold text-white mb-3">Booking Confirmed!</h1>
        <p className="text-[#CBD5E1] text-body-lg mb-2">{title}</p>
        <p className="text-body-sm text-[#94A3B8] mb-1">
          {bookedDate} · {guests} guest{guests > 1 ? "s" : ""}
          {duration ? ` · ${duration}` : ""}
        </p>
        <p className="text-heading-md font-bold text-white mb-8">MK {totalPrice.toLocaleString()}</p>

        {/* Add to Calendar */}
        <button
          onClick={handleAddToCalendar}
          className="mb-6 w-full px-4 py-3 rounded-xl bg-[#111827] text-white text-body-sm font-medium border border-white/[0.1] hover:bg-white/5 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Add to Calendar
        </button>

        {earnedPoints > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#FF0F73]/10 to-[#FF7A1A]/10 border border-[#FF0F73]/20">
            <p className="text-body-sm font-bold text-[#F1F5F9] mb-1">
              You earned {earnedPoints.toLocaleString()} points!
            </p>
            {tierUpgrade ? (
              <p className="text-caption text-emerald-400 font-medium">
                You&apos;ve been upgraded to {tierUpgrade}!
              </p>
            ) : (
              <p className="text-caption text-[#CBD5E1]">
                Keep booking to unlock more rewards and higher tiers.
              </p>
            )}
          </div>
        )}

        <p className="text-caption text-[#94A3B8] mb-6">
          Check your email for the full confirmation and receipt.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/bookings"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all"
          >
            View My Bookings
          </Link>
          <Link
            href="/loyalty"
            className="px-8 py-3 rounded-xl bg-[#111827] text-white font-semibold text-body-sm border border-white/[0.1] hover:bg-white/5 transition-all"
          >
            View Rewards
          </Link>
          <Link
            href="/"
            className="px-8 py-3 rounded-xl bg-[#111827] text-white font-semibold text-body-sm border border-white/[0.1] hover:bg-white/5 transition-all"
          >
            Discover More
          </Link>
        </div>
      </div>

      {/* Keyframes injection */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(-20px) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(80vh) rotate(720deg) scale(0.3);
          }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
