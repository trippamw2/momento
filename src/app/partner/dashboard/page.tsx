"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardStats {
  totalExperiences: number;
  activeExperiences: number;
  totalBookings: number;
  totalEarnings: number;
  averageRating: number;
  reviewCount: number;
}

interface RecentBooking {
  id: string;
  experienceTitle: string;
  guestName: string;
  date: string;
  amount: number;
  status: "confirmed" | "completed" | "cancelled";
}

const MOCK_STATS: DashboardStats = {
  totalExperiences: 4,
  activeExperiences: 3,
  totalBookings: 28,
  totalEarnings: 1850000,
  averageRating: 4.6,
  reviewCount: 24,
};

const MOCK_BOOKINGS: RecentBooking[] = [
  { id: "b1", experienceTitle: "Sunset Wine Tasting at Cape Maclear", guestName: "Alice M.", date: "2026-06-24", amount: 120000, status: "completed" },
  { id: "b2", experienceTitle: "Lilongwe Street Food Tour", guestName: "Bob K.", date: "2026-06-25", amount: 45000, status: "confirmed" },
  { id: "b3", experienceTitle: "Zomba Plateau Hike", guestName: "Chiara N.", date: "2026-06-26", amount: 60000, status: "confirmed" },
  { id: "b4", experienceTitle: "Lake Malawi Snorkeling Adventure", guestName: "David P.", date: "2026-06-22", amount: 85000, status: "completed" },
  { id: "b5", experienceTitle: "Sunset Wine Tasting at Cape Maclear", guestName: "Eve T.", date: "2026-06-28", amount: 120000, status: "cancelled" },
];

interface PartnerExperience {
  id: string;
  name: string;
  bookings: number;
  rating: number;
  revenue: number;
  status: string;
}

export default function PartnerDashboardPage() {
  const [stats] = useState<DashboardStats>(MOCK_STATS);
  const [bookings] = useState<RecentBooking[]>(MOCK_BOOKINGS);
  const [isPartner, setIsPartner] = useState(false);
  const [experiences, setExperiences] = useState<PartnerExperience[]>([]);
  const [experiencesLoading, setExperiencesLoading] = useState(true);
  const [experiencesError, setExperiencesError] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("experio-user-role");
    setIsPartner(role === "partner");
  }, []);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const token = localStorage.getItem("experio-auth-token");
        if (!token) { setExperiencesLoading(false); return; }
        const res = await fetch("/api/experiences/partner", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = (Array.isArray(data) ? data : data?.experiences ?? []).map((e: Record<string, unknown>) => ({
            id: String(e.id ?? ""),
            name: String(e.title ?? e.name ?? "Untitled"),
            bookings: Number(e.booking_count ?? e.bookings ?? 0),
            rating: Number(e.rating ?? 0),
            revenue: Number(e.revenue ?? e.total_revenue ?? 0),
            status: String(e.status ?? "draft"),
          }));
          setExperiences(mapped);
        } else {
          setExperiencesError("Could not load experiences.");
        }
      } catch {
        setExperiencesError("Network error loading experiences.");
      } finally {
        setExperiencesLoading(false);
      }
    };
    fetchExperiences();
  }, []);

  if (!isPartner) {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-lg mx-auto px-4 sm:px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#DD2A7B]/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#DD2A7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-heading-xl font-bold text-[#222222] mb-3">Partner Access Required</h1>
          <p className="text-[#6a6a6a] text-body mb-6">
            Please sign in with a partner account to access the dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-[#DD2A7B] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all"
            >
              Back to Home
            </Link>
            <Link
              href="/partner/list-experience"
              className="px-6 py-3 rounded-xl border border-[#dddddd] text-[#222222] font-semibold text-body-sm hover:bg-[#fafafa] transition-all"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-display-sm font-bold text-[#222222] mb-1">Partner Dashboard</h1>
            <p className="text-[#6a6a6a] text-body-lg">Manage your experiences and track performance.</p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Link
              href="/partner/list-experience"
              className="px-5 py-2.5 rounded-xl bg-[#DD2A7B] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Experience
            </Link>
            <Link
              href="/partner/resources"
              className="px-5 py-2.5 rounded-xl border border-[#dddddd] text-[#222222] font-semibold text-body-sm hover:bg-[#fafafa] transition-all"
            >
              Resources
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
            <p className="text-caption text-[#6a6a6a] font-medium mb-1">Total Experiences</p>
            <p className="text-heading-xl font-bold text-[#222222]">{stats.totalExperiences}</p>
            <p className="text-caption text-emerald-600 mt-1">{stats.activeExperiences} active</p>
          </div>
          <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
            <p className="text-caption text-[#6a6a6a] font-medium mb-1">Total Bookings</p>
            <p className="text-heading-xl font-bold text-[#222222]">{stats.totalBookings}</p>
            <p className="text-caption text-emerald-600 mt-1">All time</p>
          </div>
          <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
            <p className="text-caption text-[#6a6a6a] font-medium mb-1">Total Earnings</p>
            <p className="text-heading-xl font-bold text-[#222222]">MK {stats.totalEarnings.toLocaleString()}</p>
            <p className="text-caption text-emerald-600 mt-1">Gross revenue</p>
          </div>
          <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
            <p className="text-caption text-[#6a6a6a] font-medium mb-1">Average Rating</p>
            <p className="text-heading-xl font-bold text-[#222222] flex items-center gap-2">
              {stats.averageRating}
              <span className="text-yellow-500 text-heading-sm">★</span>
            </p>
            <p className="text-caption text-[#6a6a6a] mt-1">{stats.reviewCount} reviews</p>
          </div>
        </div>

        {/* Main Content: Recent Bookings + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bookings Table */}
          <div className="lg:col-span-2 rounded-2xl border border-[#dddddd] bg-white overflow-hidden">
            <div className="p-5 border-b border-[#dddddd]">
              <h2 className="text-heading-sm font-bold text-[#222222]">Recent Bookings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-caption text-[#6a6a6a] font-medium border-b border-[#dddddd]">
                    <th className="px-5 py-3">Experience</th>
                    <th className="px-5 py-3">Guest</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-[#dddddd]/50 last:border-0 hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3.5 text-body-sm font-medium text-[#222222] max-w-[200px] truncate">{b.experienceTitle}</td>
                      <td className="px-5 py-3.5 text-body-sm text-[#6a6a6a]">{b.guestName}</td>
                      <td className="px-5 py-3.5 text-body-sm text-[#6a6a6a]">{new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="px-5 py-3.5 text-body-sm font-semibold text-[#222222]">MK {b.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium ${
                          b.status === "confirmed"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : b.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#dddddd] text-center">
              <button className="text-body-sm text-[#DD2A7B] font-medium hover:underline">
                View All Bookings →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
              <h2 className="text-heading-sm font-bold text-[#222222] mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/partner/list-experience"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#fafafa] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#DD2A7B]/10 flex items-center justify-center text-lg group-hover:bg-[#DD2A7B]/20 transition-colors">
                    ➕
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-[#222222]">List New Experience</p>
                    <p className="text-caption text-[#6a6a6a]">Create a new offering</p>
                  </div>
                </Link>
                <Link
                  href="/partner/resources"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#fafafa] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg group-hover:bg-amber-100 transition-colors">
                    📖
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-[#222222]">Partner Resources</p>
                    <p className="text-caption text-[#6a6a6a]">Guides &amp; best practices</p>
                  </div>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#fafafa] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg group-hover:bg-purple-100 transition-colors">
                    ⚙️
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-[#222222]">Profile Settings</p>
                    <p className="text-caption text-[#6a6a6a]">Update your information</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Earnings Summary */}
            <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
              <h2 className="text-heading-sm font-bold text-[#222222] mb-4">This Month</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-[#6a6a6a]">Bookings</span>
                  <span className="text-body-sm font-semibold text-[#222222]">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-[#6a6a6a]">Revenue</span>
                  <span className="text-body-sm font-semibold text-[#222222]">MK 840,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-[#6a6a6a]">Avg. per booking</span>
                  <span className="text-body-sm font-semibold text-[#222222]">MK 70,000</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#dddddd]">
                  <span className="text-body-sm font-semibold text-[#222222]">Projected (30d)</span>
                  <span className="text-body-sm font-bold text-emerald-600">MK 1,050,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Experiences Overview */}
        <div className="rounded-2xl border border-[#dddddd] bg-white overflow-hidden">
          <div className="p-5 border-b border-[#dddddd] flex items-center justify-between">
            <h2 className="text-heading-sm font-bold text-[#222222]">Your Experiences</h2>
            <Link
              href="/partner/list-experience"
              className="text-body-sm text-[#DD2A7B] font-medium hover:underline"
            >
              Manage All →
            </Link>
          </div>
          <div className="divide-y divide-[#dddddd]/50">
            {experiencesLoading ? (
              <div className="p-8 text-center text-[#6a6a6a] text-body-sm">
                Loading experiences...
              </div>
            ) : experiencesError ? (
              <div className="p-8 text-center">
                <p className="text-body-sm text-red-500 mb-2">{experiencesError}</p>
                <p className="text-caption text-[#6a6a6a]">Showing mock data instead</p>
              </div>
            ) : experiences.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-body-sm text-[#6a6a6a] mb-2">You haven&apos;t listed any experiences yet.</p>
                <Link href="/partner/list-experience" className="text-body-sm text-[#DD2A7B] font-medium hover:underline">
                  List your first experience →
                </Link>
              </div>
            ) : experiences.map((exp, i) => (
              <div key={exp.id || i} className="p-4 hover:bg-[#fafafa] transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#DD2A7B]/10 flex items-center justify-center text-body-sm font-bold text-[#DD2A7B] flex-shrink-0">
                    {exp.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-[#222222] truncate">{exp.name}</p>
                    <p className="text-caption text-[#6a6a6a] flex items-center gap-2">
                      <span>{exp.bookings} bookings</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        {exp.rating} <span className="text-yellow-500">★</span>
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-body-sm font-semibold text-[#222222]">MK {exp.revenue.toLocaleString()}</p>
                  <span className={`text-caption font-medium ${
                    exp.status === "active" || exp.status === "published" ? "text-emerald-600" : "text-[#6a6a6a]"
                  }`}>
                    {exp.status === "active" || exp.status === "published" ? "● Live" : "○ Draft"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
