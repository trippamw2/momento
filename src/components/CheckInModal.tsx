"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface BookingForCheckIn {
  id: string;
  booking_ref: string | null;
  experience_title: string;
  guest_name: string;
  guest_email: string;
  guests_count: number;
  total_price: number;
  experience_date: string;
  experience_time: string | null;
  status: string;
}

interface Props {
  onClose: () => void;
}

export default function CheckInModal({ onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [booking, setBooking] = useState<BookingForCheckIn | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    setBooking(null);
    setCheckedIn(false);

    const token = localStorage.getItem("experio-auth-token");
    try {
      const res = await fetch(
        `/api/bookings/partner?search=${encodeURIComponent(searchQuery.trim())}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = await res.json();
      if (res.ok && data.booking) {
        setBooking(data.booking);
      } else {
        setError(data.error || "Booking not found");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async () => {
    if (!booking) return;
    setCheckingIn(true);
    const token = localStorage.getItem("experio-auth-token");
    try {
      const res = await fetch(`/api/bookings/${booking.id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) {
        setCheckedIn(true);
      } else {
        const data = await res.json();
        setError(data.error || "Check-in failed");
      }
    } catch {
      setError("Network error during check-in");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleQuickRef = async () => {
    if (!bookingRef.trim()) return;
    setSearchQuery(bookingRef.trim());
    setSearching(true);
    setError("");
    setBooking(null);
    setCheckedIn(false);

    const token = localStorage.getItem("experio-auth-token");
    try {
      const res = await fetch(
        `/api/bookings/partner?ref=${encodeURIComponent(bookingRef.trim())}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = await res.json();
      if (res.ok && data.booking) {
        setBooking(data.booking);
      } else {
        setError(data.error || "Booking not found");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#111827] border border-white/[0.08] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-[#FF0F73] via-[#FFA22C] to-[#F82D7B]" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-heading-lg font-bold text-[#F1F5F9]">Customer Check-In</h2>
              <p className="text-caption text-[#CBD5E1] mt-0.5">
                Search by name, email, or booking reference
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.05] text-[#CBD5E1] transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Quick Reference Number */}
          <div className="flex gap-2 mb-3">
            <input
              ref={inputRef}
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleQuickRef(); }}
              placeholder="Enter booking reference (e.g. XPRO-BK-001)"
              className="flex-1 px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all font-mono"
            />
            <button
              onClick={handleQuickRef}
              disabled={!bookingRef.trim() || searching}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50"
            >
              {searching ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : "Find"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-caption text-[#64748B]">or search</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Name / Email Search */}
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="Customer name or email"
              className="flex-1 px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
              className="px-5 py-3 rounded-xl bg-[#1E293B] text-[#CBD5E1] font-semibold text-body-sm border border-white/[0.1] hover:bg-white/[0.05] transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-body-sm text-[#c13515] bg-[#c13515]/8 px-3 py-2 rounded-xl mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}

          {/* Booking Result */}
          {booking && (
            <div className="rounded-2xl bg-[#0A0E17] border border-white/[0.08] overflow-hidden">
              <div className="p-5">
                {checkedIn ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-heading-md font-bold text-[#F1F5F9] mb-1">Checked In!</h3>
                    <p className="text-[#CBD5E1] text-body-sm mb-4">
                      {booking.guest_name} has been checked in for {booking.experience_title}
                    </p>
                    <button
                      onClick={() => { setBooking(null); setSearchQuery(""); setBookingRef(""); }}
                      className="px-6 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all"
                    >
                      Check In Another Guest
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white text-heading font-bold shrink-0">
                        {booking.guest_name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-heading-sm font-bold text-[#F1F5F9] truncate">{booking.guest_name}</h3>
                        <p className="text-caption text-[#CBD5E1]">{booking.guest_email}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-body-sm mb-5">
                      <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                        <span className="text-[#94A3B8]">Experience</span>
                        <span className="text-[#F1F5F9] font-medium">{booking.experience_title}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                        <span className="text-[#94A3B8]">Date</span>
                        <span className="text-[#F1F5F9]">
                          {new Date(booking.experience_date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {booking.experience_time && (
                        <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                          <span className="text-[#94A3B8]">Time</span>
                          <span className="text-[#F1F5F9]">{booking.experience_time}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                        <span className="text-[#94A3B8]">Guests</span>
                        <span className="text-[#F1F5F9]">{booking.guests_count}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                        <span className="text-[#94A3B8]">Reference</span>
                        <span className="text-[#F1F5F9] font-mono text-caption">{booking.booking_ref || booking.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-[#94A3B8]">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-caption font-medium ${
                          booking.status === "confirmed" || booking.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckIn}
                      disabled={checkingIn || booking.status === "completed" || booking.status === "cancelled"}
                      className={`w-full py-3 rounded-xl font-semibold text-body-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        booking.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)]"
                      }`}
                    >
                      {checkingIn ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Checking in...
                        </>
                      ) : booking.status === "completed" ? (
                        "âœ“ Already Checked In"
                      ) : booking.status === "cancelled" ? (
                        "âœ• Booking Cancelled"
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Confirm Check-In
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!booking && !error && !searching && (
            <div className="text-center py-6 px-4">
              <div className="w-12 h-12 rounded-full bg-[#0A0E17] border border-white/[0.08] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-body-sm text-[#64748B]">Enter a booking reference or search for a customer to check in</p>
            </div>
          )}

          {searching && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
