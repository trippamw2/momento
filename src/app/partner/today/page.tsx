"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface Booking {
  id: string;
  experience_title: string;
  guest_name: string;
  booking_date: string;
  total_amount: number;
  status: "confirmed" | "completed" | "cancelled";
  guest_count: number;
}

export default function TodayPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isPartner) return;
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;

    fetch("/api/partners/bookings?limit=100", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const bookings = data.bookings || [];
        const today = new Date().toISOString().split("T")[0];

        const todayItems = bookings.filter((b: Booking) => b.booking_date?.startsWith(today));
        const upcomingItems = bookings
          .filter((b: Booking) => b.booking_date && b.booking_date > today)
          .sort((a: Booking, b: Booking) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
          .slice(0, 10);

        setTodayBookings(todayItems);
        setUpcomingBookings(upcomingItems);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, isPartner]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-white/10 text-white/60 border-white/20";
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
      <div>
        <h1 className="text-display-sm font-bold text-white mb-2">Today</h1>
        <p className="text-[#64748B] text-body-lg">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Today's Reservations */}
      <section className="space-y-4">
        <h2 className="text-heading-sm font-bold text-white">Today's Reservations</h2>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-white/20 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M8 7V3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4M8 21h8M12 3v4m0 0h4M12 7h.01M16 21H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2v2h4V3h2v2h2v14a2 2 0 0 1-2 2z" />
            </svg>
            <h3 className="text-heading-sm font-bold text-white mb-2">No reservations today</h3>
            <p className="text-[#64748B] text-body-sm">Enjoy your day off — new bookings will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayBookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">{booking.experience_title?.charAt(0) || "E"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-white truncate">{booking.experience_title}</p>
                      <p className="text-caption text-[#64748B] flex items-center gap-2">
                        <span>👤 {booking.guest_name}</span>
                        <span>·</span>
                        <span>👥 {booking.guest_count} guest{booking.guest_count !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>🕐 {formatTime(booking.booking_date)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-caption font-semibold border ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    <span className="text-body font-bold text-white hidden sm:block">MK {booking.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="space-y-4">
        <h2 className="text-heading-sm font-bold text-white">Upcoming (Next 7 Days)</h2>
        {upcomingBookings.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-8 text-center">
            <p className="text-[#64748B] text-body-sm">No upcoming reservations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-white/[0.06] bg-[#111827] p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-body-sm font-semibold text-[#FF0F73]">{booking.experience_title?.charAt(0) || "E"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-white truncate">{booking.experience_title}</p>
                      <p className="text-caption text-[#64748B] flex flex-wrap items-center gap-2">
                        <span>{formatDate(booking.booking_date)} · {formatTime(booking.booking_date)}</span>
                        <span>·</span>
                        <span>👤 {booking.guest_name}</span>
                        <span>·</span>
                        <span>👥 {booking.guest_count}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold border ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    <span className="text-body-sm font-semibold text-white">MK {booking.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}