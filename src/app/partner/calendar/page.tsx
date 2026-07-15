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

export default function CalendarPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateBookings, setSelectedDateBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isPartner) return;
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;

    fetch("/api/partners/bookings?limit=200", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const bookingsData = data.bookings || [];
        setBookings(bookingsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, isPartner]);

  useEffect(() => {
    if (selectedDate && bookings.length > 0) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const dayBookings = bookings.filter((b) => b.booking_date?.startsWith(dateStr));
      setSelectedDateBookings(dayBookings);
    } else {
      setSelectedDateBookings([]);
    }
  }, [selectedDate, bookings]);

  const daysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  };

  const { firstDay, daysInMonth: totalDays, year, month } = daysInMonth(currentDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const hasBooking = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.some((b) => b.booking_date?.startsWith(dateStr));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-white mb-2">Calendar</h1>
          <p className="text-[#64748B] text-body-lg">Manage your availability and bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="p-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-heading-sm font-semibold text-white w-40 text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="p-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.08] bg-white/[0.02]">
          {dayNames.map((day) => (
            <div key={day} className="px-3 py-3 text-center text-caption font-semibold text-[#64748B]">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 p-2 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of month */}
          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const hasBkg = hasBooking(day);
            const today = isToday(day);
            const selected = isSelected(day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(new Date(year, month, day))}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-start p-2 transition-all ${
                  selected
                    ? "bg-[#FF0F73]/20 border-2 border-[#FF0F73]"
                    : today
                    ? "bg-[#FF0F73]/10 border border-[#FF0F73]"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <span className={`text-body-sm font-medium ${today && !selected ? "text-[#FF0F73]" : selected ? "text-[#FF0F73]" : "text-white"}`}>
                  {day}
                </span>
                {hasBkg && (
                  <span className={`w-2 h-2 rounded-full mt-1 ${
                    selected ? "bg-[#FF0F73]" : today ? "bg-[#FF0F73]" : "bg-white/30"
                  }`} />
                )}
              </button>
            );
          })}

          {/* Empty cells after last day to fill grid */}
          {Array.from({ length: (7 - ((firstDay + totalDays) % 7)) % 7 }, (_, i) => (
            <div key={`empty-end-${i}`} className="aspect-square" />
          ))}
        </div>
      </div>

      {/* Selected Date Bookings */}
      {selectedDate && (
        <section className="space-y-4">
          <h2 className="text-heading-sm font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
            </svg>
            Bookings on {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </h2>
          {selectedDateBookings.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-8 text-center">
              <p className="text-[#64748B] text-body-sm">No bookings on this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateBookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-white/[0.06] bg-[#111827] p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-body-sm font-semibold text-[#FF0F73]">{booking.experience_title?.charAt(0) || "E"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-white truncate">{booking.experience_title}</p>
                        <p className="text-caption text-[#64748B] flex flex-wrap items-center gap-2">
                          <span>🕐 {new Date(booking.booking_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
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
      )}
    </div>
  );
}