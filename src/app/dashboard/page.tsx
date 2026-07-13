"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UserData = {
  id: string;
  email: string;
  role: string;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

type BookingData = {
  id: string;
  experience_title?: string;
  experience_id?: string;
  status: string;
  total_price?: number;
  experience_date?: string;
  created_at?: string;
  booking_ref?: string;
};

type WalletSummary = {
  balance: number;
  currency: string;
};

type LoyaltyData = {
  points: number;
  tier: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("experio-auth-token");
}

function formatCurrency(amount: number): string {
  return `MK ${amount.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/auth/me", { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/wallet", { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/loyalty", { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/bookings?limit=5", { headers }).then((r) => (r.ok ? r.json() : { bookings: [] })),
    ])
      .then(([userData, walletData, loyaltyData, bookingsData]) => {
        setUser(userData);
        setWallet(walletData);
        setLoyalty(loyaltyData);
        setBookings(bookingsData.bookings || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-[#05070B]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="space-y-6 animate-pulse">
            <div className="h-24 bg-[#111827] rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-[#111827] rounded-2xl" />)}
            </div>
            <div className="h-64 bg-[#111827] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-[#05070B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#111827] flex items-center justify-center">
            <svg className="w-7 h-7 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h1 className="text-heading-xl font-bold text-[#F1F5F9] mb-2">Welcome</h1>
          <p className="text-[#CBD5E1] mb-6">Sign in to view your dashboard</p>
          <Link
            href="/experiences"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold"
          >
            Browse Experiences
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user.profile?.full_name || user.email?.split("@")[0] || "Guest";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#05070B]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-br from-[#FF0F73]/10 to-[#FF7A1A]/5 rounded-2xl p-6 border border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {initials}
            </div>
            <div>
              <h1 className="text-heading-xl font-bold text-[#F1F5F9]">
                Welcome back, {displayName.split(" ")[0]}
              </h1>
              <p className="text-[#94A3B8] text-body-sm">Here&apos;s your activity overview</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/bookings"
            className="p-5 rounded-2xl bg-[#111827] border border-white/[0.06] hover:border-white/[0.15] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center mb-3 group-hover:bg-[#FF0F73]/10 transition-colors">
              <svg className="w-5 h-5 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{bookings.length}</p>
            <p className="text-caption text-[#94A3B8]">Bookings</p>
          </Link>

          <Link
            href="/wallet"
            className="p-5 rounded-2xl bg-[#111827] border border-white/[0.06] hover:border-white/[0.15] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center mb-3 group-hover:bg-[#FF0F73]/10 transition-colors">
              <svg className="w-5 h-5 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">
              {wallet ? formatCurrency(wallet.balance) : "—"}
            </p>
            <p className="text-caption text-[#94A3B8]">{wallet?.currency || "Wallet"}</p>
          </Link>

          <Link
            href="/loyalty"
            className="p-5 rounded-2xl bg-[#111827] border border-white/[0.06] hover:border-white/[0.15] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center mb-3 group-hover:bg-[#FF0F73]/10 transition-colors">
              <svg className="w-5 h-5 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">
              {loyalty ? loyalty.points.toLocaleString() : "—"}
            </p>
            <p className="text-caption text-[#94A3B8]">
              {loyalty ? `${loyalty.tier} points` : "Loyalty"}
            </p>
          </Link>
        </div>

        {/* Recent Bookings (Memories) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-lg font-bold text-[#F1F5F9]">Recent Memories</h2>
            {bookings.length > 0 && (
              <Link href="/bookings" className="text-caption font-medium text-[#FF0F73] hover:text-[#FF7A1A] transition-colors">
                View all →
              </Link>
            )}
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#111827] border border-white/[0.06] text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1E293B] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-[#CBD5E1] text-body-sm mb-1">No bookings yet</p>
              <p className="text-caption text-[#64748B] mb-4">Start exploring experiences to create memories</p>
              <Link
                href="/experiences"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white text-body-sm font-semibold inline-block hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all"
              >
                Explore Experiences
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[#111827] border border-white/[0.06] hover:bg-[#1A2235] transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    b.status === "confirmed" || b.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : b.status === "cancelled"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-[#1E293B] text-[#94A3B8]"
                  }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={b.status === "completed" || b.status === "confirmed" ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-[#F1F5F9] truncate">
                      {b.experience_title || `Booking #${b.booking_ref || b.id.slice(0, 8)}`}
                    </p>
                    <p className="text-caption text-[#94A3B8]">
                      {b.experience_date ? new Date(b.experience_date).toLocaleDateString() : ""}
                      {b.total_price ? ` · ${formatCurrency(b.total_price)}` : ""}
                      {b.created_at ? ` · ${timeAgo(b.created_at)}` : ""}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-caption font-medium ${
                    b.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" :
                    b.status === "completed" ? "bg-blue-500/10 text-blue-400" :
                    b.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                    b.status === "cancelled" ? "bg-red-500/10 text-red-400" :
                    "bg-[#1E293B] text-[#94A3B8]"
                  }`}>
                    {b.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/experiences"
            className="p-4 rounded-xl bg-[#111827] border border-white/[0.06] hover:border-white/[0.15] transition-all text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1E293B] flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-caption font-medium text-[#CBD5E1]">Discover</p>
          </Link>
          <Link
            href="/saved"
            className="p-4 rounded-xl bg-[#111827] border border-white/[0.06] hover:border-white/[0.15] transition-all text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1E293B] flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <p className="text-caption font-medium text-[#CBD5E1]">Saved</p>
          </Link>
          <Link
            href="/wallet/top-up"
            className="p-4 rounded-xl bg-[#111827] border border-white/[0.06] hover:border-white/[0.15] transition-all text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1E293B] flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            <p className="text-caption font-medium text-[#CBD5E1]">Top Up</p>
          </Link>
          <Link
            href="/profile"
            className="p-4 rounded-xl bg-[#111827] border border-white/[0.06] hover:border-white/[0.15] transition-all text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1E293B] flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <p className="text-caption font-medium text-[#CBD5E1]">Profile</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
