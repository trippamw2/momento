"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { experiences } from "@/lib/data";
import AuthModal from "@/components/AuthModal";

interface Booking {
  id: string;
  experienceId: string;
  title: string;
  venue: string;
  image: string;
  date: string;
  dateLabel: string;
  time: string;
  guests: number;
  status: "upcoming" | "completed" | "cancelled";
  price: number;
  bookingRef: string;
}

interface ApiBooking {
  id: string;
  experience_id: string;
  guests_count: number;
  total_price: number;
  status: string;
  experience_date: string;
  experience_time: string;
  created_at: string;
  booking_ref: string;
  experience: {
    title: string;
    slug: string;
    location: string;
    price: number;
    currency: string;
    images: { url: string; alt: string; is_primary: boolean }[];
  } | null;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatDateLabel(d: Date): string {
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return `${d.toLocaleDateString("en-US", { weekday: "long" })}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function computeCountdown(dateStr: string): { days: number; hours: number; mins: number; expired: boolean } {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, expired: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { days, hours, mins, expired: false };
}

const now = new Date();

const mockBookings: Booking[] = [
  {
    id: "b1", experienceId: "sunset-cruise", title: "Sunset Cruise", venue: "Cape Maclear Cruises",
    image: experiences.find((e) => e.id === "sunset-cruise")!.image,
    date: addDays(now, 3).toISOString(), dateLabel: formatDateLabel(addDays(now, 3)),
    time: "4:00 PM", guests: 2, status: "upcoming", price: 55000, bookingRef: "MOMO-BK-001",
  },
  {
    id: "b2", experienceId: "pool-lunch", title: "Pool & Lunch", venue: "Lilongwe Club & Spa",
    image: experiences.find((e) => e.id === "pool-lunch")!.image,
    date: addDays(now, 7).toISOString(), dateLabel: formatDateLabel(addDays(now, 7)),
    time: "10:00 AM", guests: 4, status: "upcoming", price: 45000, bookingRef: "MOMO-BK-002",
  },
  {
    id: "b3", experienceId: "spa-day", title: "Spa Day", venue: "Blantyre Wellness Collective",
    image: experiences.find((e) => e.id === "spa-day")!.image,
    date: addDays(now, -5).toISOString(), dateLabel: formatDateLabel(addDays(now, -5)),
    time: "9:00 AM", guests: 1, status: "completed", price: 85000, bookingRef: "MOMO-BK-003",
  },
  {
    id: "b4", experienceId: "date-night", title: "Date Night", venue: "Lake Malawi Private Dining",
    image: experiences.find((e) => e.id === "date-night")!.image,
    date: addDays(now, -14).toISOString(), dateLabel: formatDateLabel(addDays(now, -14)),
    time: "6:30 PM", guests: 2, status: "completed", price: 65000, bookingRef: "MOMO-BK-004",
  },
  {
    id: "b5", experienceId: "rooftop-dining", title: "Rooftop Dining", venue: "Skyline Dining Co.",
    image: experiences.find((e) => e.id === "rooftop-dining")!.image,
    date: addDays(now, 14).toISOString(), dateLabel: formatDateLabel(addDays(now, 14)),
    time: "7:00 PM", guests: 2, status: "upcoming", price: 75000, bookingRef: "MOMO-BK-005",
  },
  {
    id: "b6", experienceId: "glamping-weekend", title: "Glamping Weekend", venue: "Bush & Lakeside Co.",
    image: experiences.find((e) => e.id === "glamping-weekend")!.image,
    date: addDays(now, -30).toISOString(), dateLabel: formatDateLabel(addDays(now, -30)),
    time: "2:00 PM", guests: 2, status: "cancelled", price: 200000, bookingRef: "MOMO-BK-006",
  },
  {
    id: "b7", experienceId: "brunch-experience", title: "Brunch Experience", venue: "The Velvet Fork",
    image: experiences.find((e) => e.id === "brunch-experience")!.image,
    date: addDays(now, -60).toISOString(), dateLabel: formatDateLabel(addDays(now, -60)),
    time: "11:00 AM", guests: 3, status: "completed", price: 35000, bookingRef: "MOMO-BK-007",
  },
  {
    id: "b8", experienceId: "private-beach-dinner", title: "Private Beach Dinner", venue: "Beachside Elegance",
    image: experiences.find((e) => e.id === "private-beach-dinner")!.image,
    date: addDays(now, 21).toISOString(), dateLabel: formatDateLabel(addDays(now, 21)),
    time: "6:00 PM", guests: 2, status: "upcoming", price: 130000, bookingRef: "MOMO-BK-008",
  },
  {
    id: "b9", experienceId: "wellness-retreat", title: "Wellness Retreat", venue: "Salima Sanctuary",
    image: experiences.find((e) => e.id === "wellness-retreat")!.image,
    date: addDays(now, -20).toISOString(), dateLabel: formatDateLabel(addDays(now, -20)),
    time: "8:00 AM", guests: 1, status: "cancelled", price: 150000, bookingRef: "MOMO-BK-009",
  },
];

function mapApiBooking(api: ApiBooking): Booking {
  const img = api.experience?.images?.find((i) => i.is_primary)?.url || api.experience?.images?.[0]?.url || "";
  const exp = experiences.find((e) => e.id === api.experience_id);
  const fallbackImg = exp?.image || "";
  return {
    id: api.id,
    experienceId: api.experience_id,
    title: api.experience?.title || exp?.title || "Experience",
    venue: api.experience?.location || exp?.location || "",
    image: img || fallbackImg,
    date: api.experience_date,
    dateLabel: formatDateLabel(new Date(api.experience_date)),
    time: api.experience_time || "Flexible",
    guests: api.guests_count,
    status: (api.status === "pending" ? "upcoming" : api.status === "confirmed" ? "upcoming" : api.status) as Booking["status"],
    price: api.total_price,
    bookingRef: api.booking_ref || `MOMO-${api.id.slice(0, 6).toUpperCase()}`,
  };
}

type SidebarTab = "all" | "upcoming" | "completed" | "cancelled" | "payments" | "gifted" | "refunds";

const sidebarItems: { key: SidebarTab; label: string }[] = [
  { key: "all", label: "All Memories" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "payments", label: "Payments" },
  { key: "gifted", label: "Gifted Experiences" },
  { key: "refunds", label: "Refunds" },
];

const features = [
  { title: "Easy Reschedule", desc: "Change your booking up to 48 hours before, free of charge." },
  { title: "Secure Payments", desc: "Your payments are encrypted and processed securely." },
  { title: "24/7 Support", desc: "Our team is always available to help with any questions." },
  { title: "Best Price Guarantee", desc: "Found a better price? We'll match it or refund the difference." },
];

export default function BookingsPage() {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("all");
  const [authOpen, setAuthOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [loadingApi, setLoadingApi] = useState(false);
  const [countdowns, setCountdowns] = useState<Record<string, ReturnType<typeof computeCountdown>>>({});

  // Detect auth state and fetch real bookings
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("momento-auth-token") : null;
    setSignedIn(!!token);

    if (token) {
      setLoadingApi(true);
      fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => {
          const api = (data.bookings || []).map(mapApiBooking);
          if (api.length > 0) setBookings(api);
        })
        .catch(() => {
          // Fall back to mock data on error
        })
        .finally(() => setLoadingApi(false));
    }
  }, []);

  // Re-fetch when auth modal closes and user became signed in
  const handleAuthClose = useCallback(() => {
    setAuthOpen(false);
    const token = localStorage.getItem("momento-auth-token");
    setSignedIn(!!token);
    if (token) {
      setLoadingApi(true);
      fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => {
          const api = (data.bookings || []).map(mapApiBooking);
          if (api.length > 0) setBookings(api);
        })
        .catch(() => {})
        .finally(() => setLoadingApi(false));
    }
  }, []);

  // Live countdowns for upcoming bookings
  useEffect(() => {
    const update = () => {
      const next: Record<string, ReturnType<typeof computeCountdown>> = {};
      bookings.forEach((b) => {
        if (b.status === "upcoming") {
          next[b.id] = computeCountdown(b.date);
        }
      });
      setCountdowns(next);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [bookings]);

  const getFiltered = (): Booking[] => {
    switch (sidebarTab) {
      case "all": return bookings;
      case "upcoming": return bookings.filter((b) => b.status === "upcoming");
      case "completed": return bookings.filter((b) => b.status === "completed");
      case "cancelled": return bookings.filter((b) => b.status === "cancelled");
      case "payments":
      case "gifted":
      case "refunds": return [];
      default: return bookings;
    }
  };

  const tabFilter = sidebarTab === "all" || sidebarTab === "payments" || sidebarTab === "gifted" || sidebarTab === "refunds"
    ? "all" : sidebarTab;

  const displayed = getFiltered();
  const isSpecialTab = sidebarTab === "payments" || sidebarTab === "gifted" || sidebarTab === "refunds";
  const pageTitle = sidebarItems.find((s) => s.key === sidebarTab)?.label || "All Bookings";

  return (
    <>
      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto flex gap-0 sm:gap-6 px-0 sm:px-8">
          {/* ─── Sidebar ─── */}
          <aside className="hidden sm:flex flex-col w-56 flex-shrink-0 sticky top-24 self-start">
            <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#ebebeb]">
                <h2 className="text-heading-sm font-bold text-[#222222]">My Memories</h2>
                <p className="text-caption text-[#929292] mt-0.5">{bookings.length} total</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {sidebarItems.map((item) => {
                  const count = item.key === "all" ? bookings.length
                    : item.key === "upcoming" ? bookings.filter((b) => b.status === "upcoming").length
                    : item.key === "completed" ? bookings.filter((b) => b.status === "completed").length
                    : item.key === "cancelled" ? bookings.filter((b) => b.status === "cancelled").length
                    : 0;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setSidebarTab(item.key)}
                      className={`w-full px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all duration-200 flex items-center justify-between ${
                        sidebarTab === item.key
                          ? "bg-[#f5f5f5] text-[#222222] border border-[#ebebeb]"
                          : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
                      }`}
                    >
                      <span className="flex-1 text-left">{item.label}</span>
                      {count > 0 && (
                        <span className={`text-caption px-1.5 py-0.5 rounded-md ${
                          sidebarTab === item.key ? "bg-[#ff385c] text-white" : "bg-[#f0f0f0] text-[#929292]"
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile sidebar tabs */}
          <div className="sm:hidden w-full px-4 mb-4">
            <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-2">
              {sidebarItems.slice(0, 4).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSidebarTab(item.key)}
                  className={`px-4 py-2 rounded-full text-body-sm font-medium whitespace-nowrap transition-all ${
                    sidebarTab === item.key
                      ? "bg-[#ff385c] text-white"
                      : "bg-white text-[#6a6a6a] border border-[#ebebeb] shadow-sm"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Main Content ─── */}
          <main className="flex-1 min-w-0 px-4 sm:px-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-heading-xl font-bold text-[#222222]">{pageTitle}</h1>
                <p className="text-[#6a6a6a] text-body-sm mt-0.5">
                  {isSpecialTab ? "" : `${displayed.length} booking${displayed.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              {loadingApi && signedIn && (
                <div className="flex items-center gap-2 text-body-sm text-[#929292]">
                  <div className="w-4 h-4 rounded-full border-2 border-[#ebebeb] border-t-[#ff385c] animate-spin" />
                  Loading bookings...
                </div>
              )}
              {!signedIn && !isSpecialTab && !loadingApi && (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-5 py-2 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.2)] transition-all"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Tabs (for booking views) */}
            {!isSpecialTab && displayed.length > 0 && (
              <div className="flex gap-1 p-1 rounded-xl bg-[#f0f0f0] border border-[#ebebeb] w-fit mb-6">
                {["all", "upcoming", "completed", "cancelled"].map((t) => {
                  const label = t.charAt(0).toUpperCase() + t.slice(1);
                  const count = t === "all" ? bookings.length
                    : bookings.filter((b) => b.status === t).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setSidebarTab(t as SidebarTab)}
                      className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all duration-200 ${
                        (sidebarTab === t || (sidebarTab === "all" && t === "all"))
                          ? "bg-white text-[#222222] shadow-sm"
                          : "text-[#929292] hover:text-[#6a6a6a]"
                      }`}
                    >
                      {label}
                      {count > 0 && (
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                          sidebarTab === t || (sidebarTab === "all" && t === "all")
                            ? "bg-[#ff385c]/15 text-[#ff385c]"
                            : "bg-[#f0f0f0] text-[#929292]"
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {!signedIn && !isSpecialTab ? (
              /* ─── Empty / Sign-in State ─── */
              <div className="rounded-2xl bg-white border border-[#ebebeb] p-8 sm:p-12 text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <h2 className="text-heading-lg font-bold text-[#222222] mb-2">No bookings yet</h2>
                <p className="text-[#6a6a6a] text-body mb-6 max-w-sm mx-auto">
                  Sign in to view your upcoming bookings, manage reservations, and track your experience history.
                </p>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.2)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Sign In to View Bookings
                </button>
              </div>
            ) : isSpecialTab ? (
              /* ─── Special Tab Placeholders ─── */
              <div className="rounded-2xl bg-white border border-[#ebebeb] p-8 sm:p-12 text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mx-auto mb-4">
                  {sidebarTab === "payments" ? (
                    <svg className="w-8 h-8 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                  ) : sidebarTab === "gifted" ? (
                    <svg className="w-8 h-8 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  ) : (
                    <svg className="w-8 h-8 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                  )}
                </div>
                <h2 className="text-heading-lg font-bold text-[#222222] mb-2">
                  {sidebarTab === "payments" ? "Payment History" : sidebarTab === "gifted" ? "Gifted Experiences" : "Refunds"}
                </h2>
                <p className="text-[#6a6a6a] text-body mb-6 max-w-sm mx-auto">
                  {sidebarTab === "payments" ? "View your payment history and transaction details."
                    : sidebarTab === "gifted" ? "Track all experiences you've gifted to friends and family."
                    : "Manage your refund requests and track their status."}
                </p>
                <Link
                  href={sidebarTab === "gifted" ? "/gift" : "/experiences"}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.2)] transition-all"
                >
                  {sidebarTab === "gifted" ? "Send a Gift" : "Browse Experiences"}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            ) : (
              <>
                {/* ─── Booking Cards ─── */}
                <div className="space-y-4 mb-10">
                  {displayed.map((booking) => {
                    const cd = countdowns[booking.id];
                    return (
                      <div
                        key={booking.id}
                        className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden hover:border-[#dddddd] transition-all shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row">
                          {/* Image */}
                          <div className="relative w-full sm:w-56 h-48 sm:h-auto flex-shrink-0">
                            <Image
                              src={booking.image}
                              alt={booking.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 224px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent sm:bg-gradient-to-r" />
                            <div className="absolute top-3 left-3 sm:hidden">
                              <StatusBadge status={booking.status} />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 p-4 sm:p-5">
                            <div className="hidden sm:flex items-start justify-between mb-3">
                              <StatusBadge status={booking.status} />
                            </div>

                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <Link href={`/experiences/${booking.experienceId}`}>
                                  <h3 className="text-heading-sm font-bold text-[#222222] hover:text-[#ff385c] transition-colors line-clamp-1">{booking.title}</h3>
                                </Link>
                                <p className="text-[#6a6a6a] text-body-sm mt-0.5">{booking.venue}</p>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-body-sm">
                                  <div className="flex items-center gap-1.5 text-[#6a6a6a]">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                    <span>{new Date(booking.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[#6a6a6a]">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{booking.time}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[#6a6a6a]">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                    <span>{booking.guests} guest{booking.guests !== 1 ? "s" : ""}</span>
                                  </div>
                                </div>

                                <p className="text-caption text-[#929292] mt-2">Ref: {booking.bookingRef}</p>
                              </div>

                              {/* Price + Countdown */}
                              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                <p className="text-heading-md font-bold text-[#222222] whitespace-nowrap">MK {booking.price.toLocaleString()}</p>
                                {booking.status === "upcoming" && cd && !cd.expired && (
                                  <div className="text-center">
                                    <p className="text-caption text-[#929292] mb-1">Starts in</p>
                                    <div className="flex items-center gap-2 bg-[#f7f7f7] rounded-xl px-3 py-2 border border-[#ebebeb]">
                                      <CountdownUnit value={cd.days} label="days" />
                                      <span className="text-[#929292]">:</span>
                                      <CountdownUnit value={cd.hours} label="hrs" />
                                      <span className="text-[#929292]">:</span>
                                      <CountdownUnit value={cd.mins} label="min" />
                                    </div>
                                  </div>
                                )}
                                {booking.status === "upcoming" && cd && cd.expired && (
                                  <span className="px-3 py-1 rounded-full text-caption font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                                    Starting soon
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-[#ebebeb]">
                              <Link
                                href={`/experiences/${booking.experienceId}`}
                                className="px-4 py-2 rounded-xl bg-[#f7f7f7] text-[#222222] text-body-sm font-medium hover:bg-[#f0f0f0] transition-all"
                              >
                                View Details
                              </Link>
                              {booking.status === "upcoming" && (
                                <>
                                  <button className="px-4 py-2 rounded-xl bg-[#f7f7f7] text-[#6a6a6a] text-body-sm font-medium hover:bg-[#f0f0f0] hover:text-[#222222] transition-all border border-[#ebebeb]">
                                    Reschedule
                                  </button>
                                  <button className="px-4 py-2 rounded-xl bg-[#f7f7f7] text-red-500 text-body-sm font-medium hover:bg-red-50 hover:text-red-600 transition-all border border-red-200">
                                    Cancel
                                  </button>
                                </>
                              )}
                              {booking.status === "completed" && (
                                <button className="px-4 py-2 rounded-xl bg-[#f7f7f7] text-[#6a6a6a] text-body-sm font-medium hover:bg-[#f0f0f0] hover:text-[#222222] transition-all border border-[#ebebeb]">
                                  Book Again
                                </button>
                              )}
                              {booking.status === "cancelled" && (
                                <button className="px-4 py-2 rounded-xl bg-[#f7f7f7] text-[#6a6a6a] text-body-sm font-medium hover:bg-[#f0f0f0] hover:text-[#222222] transition-all border border-[#ebebeb]">
                                  Rebook
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ─── Bottom Features ─── */}
                <section>
                  <h2 className="text-heading-md font-bold text-[#222222] mb-5 text-center">Why Book With Momento?</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((f) => (
                      <div key={f.title} className="text-center p-5 rounded-2xl bg-white border border-[#ebebeb] hover:border-[#dddddd] transition-all shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-[#ff385c]/10 flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl font-bold text-[#ff385c]">M</span>
                        </div>
                        <h3 className="text-heading-sm font-bold text-[#222222] mb-1">{f.title}</h3>
                        <p className="text-[#6a6a6a] text-body-sm leading-relaxed">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      {authOpen && <AuthModal onClose={handleAuthClose} />}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    upcoming: "bg-[#ff385c]/10 text-[#ff385c] border-[#ff385c]/20",
    completed: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    cancelled: "bg-red-400/10 text-red-400 border-red-400/20",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-caption font-medium border ${styles[status] || ""}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-heading-sm font-bold text-[#222222] leading-none">{value.toString().padStart(2, "0")}</p>
      <p className="text-[10px] text-[#929292] uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}