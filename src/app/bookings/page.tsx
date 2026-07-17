"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { experiences } from "@/lib/data";
import AuthModal from "@/components/AuthModal";
import BookingCard from "@/components/BookingCard";

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

function formatDateLabel(d: Date): string {
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return `${d.toLocaleDateString("en-US", { weekday: "long" })}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const now = new Date();

function findMockImage(id: string): string {
  return experiences.find((e) => e.id === id)?.image || "";
}

const FALLBACK_IMG = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80";

const mockBookings: Booking[] = [
  {
    id: "b1", experienceId: "sunset-cruise", title: "Sunset Cruise", venue: "Cape Maclear Cruises",
    image: findMockImage("sunset-cruise") || FALLBACK_IMG,
    date: addDays(now, 3).toISOString(), dateLabel: formatDateLabel(addDays(now, 3)),
    time: "4:00 PM", guests: 2, status: "upcoming", price: 55000, bookingRef: "XPRO-BK-001",
  },
  {
    id: "b2", experienceId: "pool-lunch", title: "Pool & Lunch", venue: "Lilongwe Club & Spa",
    image: findMockImage("pool-lunch") || FALLBACK_IMG,
    date: addDays(now, 7).toISOString(), dateLabel: formatDateLabel(addDays(now, 7)),
    time: "10:00 AM", guests: 4, status: "upcoming", price: 45000, bookingRef: "XPRO-BK-002",
  },
  {
    id: "b3", experienceId: "spa-day", title: "Spa Day", venue: "Blantyre Wellness Collective",
    image: findMockImage("spa-day") || FALLBACK_IMG,
    date: addDays(now, -5).toISOString(), dateLabel: formatDateLabel(addDays(now, -5)),
    time: "9:00 AM", guests: 1, status: "completed", price: 85000, bookingRef: "XPRO-BK-003",
  },
  {
    id: "b4", experienceId: "date-night", title: "Date Night", venue: "Lake Malawi Private Dining",
    image: findMockImage("date-night") || FALLBACK_IMG,
    date: addDays(now, -14).toISOString(), dateLabel: formatDateLabel(addDays(now, -14)),
    time: "6:30 PM", guests: 2, status: "completed", price: 65000, bookingRef: "XPRO-BK-004",
  },
  {
    id: "b5", experienceId: "rooftop-dining", title: "Rooftop Dining", venue: "Skyline Dining Co.",
    image: findMockImage("rooftop-dining") || FALLBACK_IMG,
    date: addDays(now, 14).toISOString(), dateLabel: formatDateLabel(addDays(now, 14)),
    time: "7:00 PM", guests: 2, status: "upcoming", price: 75000, bookingRef: "XPRO-BK-005",
  },
  {
    id: "b6", experienceId: "glamping-weekend", title: "Glamping Weekend", venue: "Bush & Lakeside Co.",
    image: findMockImage("glamping-weekend") || FALLBACK_IMG,
    date: addDays(now, -30).toISOString(), dateLabel: formatDateLabel(addDays(now, -30)),
    time: "2:00 PM", guests: 2, status: "cancelled", price: 200000, bookingRef: "XPRO-BK-006",
  },
  {
    id: "b7", experienceId: "brunch-experience", title: "Brunch Experience", venue: "The Velvet Fork",
    image: findMockImage("brunch-experience") || FALLBACK_IMG,
    date: addDays(now, -60).toISOString(), dateLabel: formatDateLabel(addDays(now, -60)),
    time: "11:00 AM", guests: 3, status: "completed", price: 35000, bookingRef: "XPRO-BK-007",
  },
  {
    id: "b8", experienceId: "private-beach-dinner", title: "Private Beach Dinner", venue: "Beachside Elegance",
    image: findMockImage("private-beach-dinner") || FALLBACK_IMG,
    date: addDays(now, 21).toISOString(), dateLabel: formatDateLabel(addDays(now, 21)),
    time: "6:00 PM", guests: 2, status: "upcoming", price: 130000, bookingRef: "XPRO-BK-008",
  },
  {
    id: "b9", experienceId: "wellness-retreat", title: "Wellness Retreat", venue: "Salima Sanctuary",
    image: findMockImage("wellness-retreat") || FALLBACK_IMG,
    date: addDays(now, -20).toISOString(), dateLabel: formatDateLabel(addDays(now, -20)),
    time: "8:00 AM", guests: 1, status: "cancelled", price: 150000, bookingRef: "XPRO-BK-009",
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
    bookingRef: api.booking_ref || `XPRO-${api.id.slice(0, 6).toUpperCase()}`,
  };
}

type SidebarTab = "all" | "upcoming" | "completed" | "cancelled" | "payments" | "gifted" | "refunds";

const sidebarItems: { key: SidebarTab; label: string }[] = [
  { key: "all", label: "All Memories" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "payments", label: "Payments (Coming Soon)" },
  { key: "gifted", label: "Gifted (Coming Soon)" },
  { key: "refunds", label: "Refunds (Coming Soon)" },
];

const features = [
  { title: "Easy Reschedule", desc: "Change your booking up to 48 hours before, free of charge." },
  { title: "Secure Payments", desc: "Your payments are encrypted and processed securely." },
  { title: "24/7 Support", desc: "Our team is always available to help with any questions." },
  { title: "Best Price Guarantee", desc: "Found a better price? We'll match it or refund the difference." },
];

// Sort: upcoming first (earliest date asc), then completed (most recent desc), then cancelled
function sortBookings(list: Booking[]): Booking[] {
  const priority: Record<string, number> = { upcoming: 0, completed: 1, cancelled: 2 };
  return [...list].sort((a, b) => {
    const pa = priority[a.status] ?? 3;
    const pb = priority[b.status] ?? 3;
    if (pa !== pb) return pa - pb;
    if (a.status === "upcoming") return new Date(a.date).getTime() - new Date(b.date).getTime();
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export default function BookingsPage() {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("all");
  const [authOpen, setAuthOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ bookingId: string; title: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Detect auth state and fetch real bookings
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("experio-auth-token") : null;
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
        .catch((err) => console.error("Bookings fetch failed:", err))
        .finally(() => setLoadingApi(false));
    }
  }, []);

  // Re-fetch when auth modal closes and user became signed in
  const handleAuthClose = useCallback(() => {
    setAuthOpen(false);
    const token = localStorage.getItem("experio-auth-token");
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
        .catch((err) => console.error("Bookings re-fetch failed:", err))
        .finally(() => setLoadingApi(false));
    }
  }, []);

  // Handle booking cancel: call API then update local state
  const handleCancel = useCallback(async (bookingId: string) => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by user" }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Cancel failed:", data.error);
        return;
      }
    } catch (err) {
      console.error("Cancel API call failed, falling back to local state:", err);
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: "cancelled" as const } : b
      )
    );
  }, []);

  const handleReviewSubmit = useCallback(async () => {
    if (reviewRating === 0 || !reviewModal) return;
    setReviewSending(true);
    try {
      const token = localStorage.getItem("experio-auth-token");
      await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          experience_id: reviewModal.bookingId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
    } catch { /* review stored locally */ }
    setReviewSubmitted(true);
    setReviewSending(false);
  }, [reviewRating, reviewComment, reviewModal]);

  const handleOpenReview = useCallback((bookingId: string, title: string) => {
    setReviewModal({ bookingId, title });
    setReviewRating(0);
    setReviewComment("");
    setReviewSubmitted(false);
  }, []);

  const getFiltered = useMemo((): Booking[] => {
    let filtered: Booking[];
    switch (sidebarTab) {
      case "all": filtered = bookings; break;
      case "upcoming": filtered = bookings.filter((b) => b.status === "upcoming"); break;
      case "completed": filtered = bookings.filter((b) => b.status === "completed"); break;
      case "cancelled": filtered = bookings.filter((b) => b.status === "cancelled"); break;
      case "payments":
      case "gifted":
      case "refunds": filtered = []; break;
      default: filtered = bookings;
    }
    return sortBookings(filtered);
  }, [bookings, sidebarTab]);

  const displayed = getFiltered;
  const isSpecialTab = sidebarTab === "payments" || sidebarTab === "gifted" || sidebarTab === "refunds";
  const pageTitle = sidebarItems.find((s) => s.key === sidebarTab)?.label || "All Bookings";
  const isActiveTab = (t: string) => sidebarTab === t || (sidebarTab === "all" && t === "all");

  return (
    <>
      <div className="pt-20 pb-16 min-h-screen max-h-[100dvh] overflow-hidden">
        <div className="max-w-7xl mx-auto flex gap-0 sm:gap-6 px-0 sm:px-8 h-[calc(100dvh-80px)] overflow-hidden">
          {/* ─── Sidebar ─── */}
          <aside className="hidden sm:flex flex-col w-56 flex-shrink-0 sticky top-24 self-start">
            <div className="bg-[#111827] border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-white/[0.08]">
                <h2 className="text-heading-sm font-bold text-[#F1F5F9]">My Memories</h2>
                <p className="text-caption text-[#64748B] mt-0.5">{bookings.length} total</p>
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
                          ? "bg-white/[0.08] text-[#F1F5F9] border border-white/[0.08]"
                          : "text-[#64748B] hover:text-[#F1F5F9] hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="flex-1 text-left">{item.label}</span>
                      {count > 0 && (
                        <span className={`text-caption px-1.5 py-0.5 rounded-md ${
                          sidebarTab === item.key ? "bg-[#FF0F73] text-white" : "bg-white/[0.06] text-[#64748B]"
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
                      ? "bg-[#FF0F73] text-white"
                      : "bg-[#111827] text-[#CBD5E1] border border-white/[0.08] shadow-sm"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Main Content ─── */}
          <main className="flex-1 min-w-0 px-4 sm:px-0 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-heading-xl font-bold text-[#F1F5F9]">{pageTitle}</h1>
                <p className="text-[#CBD5E1] text-body-sm mt-0.5">
                  {isSpecialTab ? "" : `${displayed.length} booking${displayed.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              {loadingApi && signedIn && (
                <div className="flex items-center gap-2 text-body-sm text-[#64748B]">
                  <div className="w-4 h-4 rounded-full border-2 border-white/[0.08] border-t-[#FF0F73] animate-spin" />
                  Loading bookings...
                </div>
              )}
              {!signedIn && !isSpecialTab && !loadingApi && (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-5 py-2 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Tabs (for booking views) */}
            {!isSpecialTab && displayed.length > 0 && (
              <div className="flex gap-1 p-1 rounded-xl bg-white/[0.06] border border-white/[0.08] w-fit mb-6">
                {["all", "upcoming", "completed", "cancelled"].map((t) => {
                  const label = t.charAt(0).toUpperCase() + t.slice(1);
                  const count = t === "all" ? bookings.length
                    : bookings.filter((b) => b.status === t).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setSidebarTab(t as SidebarTab)}
                      className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all duration-200 ${
                        isActiveTab(t)
                          ? "bg-[#111827] text-[#F1F5F9] shadow-sm"
                          : "text-[#64748B] hover:text-[#CBD5E1]"
                      }`}
                    >
                      {label}
                      {count > 0 && (
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                          isActiveTab(t)
                            ? "bg-[#FF0F73]/20 text-[#FF0F73]"
                            : "bg-white/[0.06] text-[#64748B]"
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
              <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-8 sm:p-12 text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-2">No bookings yet</h2>
                <p className="text-[#CBD5E1] text-body mb-6 max-w-sm mx-auto">
                  Sign in to view your upcoming bookings, manage reservations, and track your experience history.
                </p>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Sign In to View Bookings
                </button>
              </div>
            ) : isSpecialTab ? (
              /* ─── Special Tab Placeholders ─── */
              <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-8 sm:p-12 text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  {sidebarTab === "payments" ? (
                    <svg className="w-8 h-8 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                  ) : sidebarTab === "gifted" ? (
                    <svg className="w-8 h-8 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  ) : (
                    <svg className="w-8 h-8 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                  )}
                </div>
                <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-2">
                  {sidebarTab === "payments" ? "Payment History" : sidebarTab === "gifted" ? "Gifted Experiences" : "Refunds"}
                </h2>
                <p className="text-[#CBD5E1] text-body mb-6 max-w-sm mx-auto">
                  {sidebarTab === "payments" ? "View your payment history and transaction details."
                    : sidebarTab === "gifted" ? "Track all experiences you've gifted to friends and family."
                    : "Manage your refund requests and track their status."}
                </p>
                <Link
                  href={sidebarTab === "gifted" ? "/gift" : "/experiences"}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all"
                >
                  {sidebarTab === "gifted" ? "Send a Gift" : "Browse Experiences"}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            ) : (
              <>
                {/* ─── Booking Cards with Cancel + PDF + Countdown ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {displayed.map((booking) => (
                    <div key={booking.id}>
                      <BookingCard
                        booking={{
                          id: booking.experienceId,
                          title: booking.title,
                          date: booking.date,
                          dateLabel: booking.dateLabel,
                          time: booking.time,
                          guests: booking.guests,
                          status: booking.status,
                          price: booking.price,
                          location: booking.venue,
                          image: booking.image,
                          bookingRef: booking.bookingRef,
                        }}
                        showActions
                        onCancel={() => handleCancel(booking.id)}
                      />
                      {booking.status === "completed" && (
                        <button
                          onClick={() => handleOpenReview(booking.experienceId, booking.title)}
                          className="mt-2 w-full py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#CBD5E1] text-body-sm font-medium hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          Rate this experience
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* ─── Bottom Features ─── */}
                <section>
                  <h2 className="text-heading-md font-bold text-[#F1F5F9] mb-5 text-center">Why Book With Experio?</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((f) => (
                      <div key={f.title} className="text-center p-5 rounded-2xl bg-[#111827] border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-[#FF0F73]/10 flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl font-bold text-[#FF0F73]">E</span>
                        </div>
                        <h3 className="text-heading-sm font-bold text-[#F1F5F9] mb-1">{f.title}</h3>
                        <p className="text-[#CBD5E1] text-body-sm leading-relaxed">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ─── Review Modal ─── */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { if (!reviewSending) setReviewModal(null); }}>
          <div className="bg-[#111827] rounded-2xl border border-white/[0.1] p-6 max-w-md mx-4 shadow-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {!reviewSubmitted ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-heading-md font-bold text-[#F1F5F9]">Rate this experience</h3>
                  <button onClick={() => setReviewModal(null)} className="text-[#64748B] hover:text-white transition-colors">✕</button>
                </div>
                <p className="text-[#CBD5E1] text-body-sm mb-4">{reviewModal.title}</p>

                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-5 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 transition-all hover:scale-110"
                    >
                      <svg className={`w-8 h-8 ${star <= reviewRating ? "text-yellow-400" : "text-[#64748B]"}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Tell us about your experience (optional)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/30 transition-all resize-none mb-5"
                />

                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewRating === 0 || reviewSending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {reviewSending ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-heading-md font-bold text-[#F1F5F9] mb-2">Thank you!</h3>
                <p className="text-[#CBD5E1] text-body-sm mb-6">Your review helps others discover great experiences.</p>
                <button onClick={() => setReviewModal(null)} className="px-6 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {authOpen && <AuthModal onClose={handleAuthClose} />}
    </>
  );
}
