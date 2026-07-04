"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";

type Section = "overview" | "users" | "experiences" | "reviews" | "testimonials" | "bookings" | "settings" | "gift-cards" | "partners" | "financials";

interface OverviewData {
  totalUsers: number;
  totalPartners: number;
  totalExperiences: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}

interface UserRow {
  id: string;
  full_name: string | null;
  email?: string;
  role: string;
  created_at: string;
}

interface ExpRow {
  id: string;
  title: string;
  category: string;
  status: string;
  price: number;
  booking_count: number;
  rating: number;
}

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  created_at: string;
  user: { full_name: string; avatar_url: string } | null;
  experience: { title: string; slug: string } | null;
}

interface BookingRow {
  id: string;
  guests_count: number;
  total_price: number;
  status: string;
  experience_date: string;
  created_at: string;
  experience: { title: string; slug: string; location: string } | null;
}

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "ðŸ“Š" },
  { key: "users", label: "Users", icon: "ðŸ‘¥" },
  { key: "experiences", label: "Experiences", icon: "ðŸŽ¯" },
  { key: "reviews", label: "Reviews", icon: "â­" },
  { key: "testimonials", label: "Testimonials", icon: "ðŸ’¬" },
  { key: "bookings", label: "Bookings", icon: "ðŸ“…" },
  { key: "gift-cards", label: "Gift Cards", icon: "ðŸŽ" },
  { key: "partners", label: "Partners", icon: "ðŸ¤" },
  { key: "financials", label: "Financials", icon: "ðŸ’°" },
  { key: "settings", label: "Settings", icon: "âš™ï¸" },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-emerald-900/30 text-emerald-400",
    pending: "bg-amber-900/30 text-amber-400",
    completed: "bg-blue-900/30 text-blue-400",
    cancelled: "bg-red-900/30 text-red-400",
    published: "bg-emerald-900/30 text-emerald-400",
    draft: "bg-gray-800 text-gray-300",
    archived: "bg-red-900/30 text-red-400",
    paused: "bg-amber-900/30 text-amber-400",
    approved: "bg-emerald-900/30 text-emerald-400",
    rejected: "bg-red-900/30 text-red-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-caption font-medium capitalize ${colors[status] || "bg-gray-800 text-gray-300"}`}>
      {status}
    </span>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { allowed: isAdmin, loading: authLoading } = useAuthGuard({ requiredRole: "admin" });

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [experiences, setExperiences] = useState<ExpRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [testimonials, setTestimonials] = useState<ReviewRow[]>([]);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  // Mock data for new sections (will be replaced with API data)
  const [giftCards] = useState([
    { code: "MOMO-GC-001", amount: 100000, balance: 100000, status: "active", buyer: "John D.", recipient: "Jane D.", created: "2026-06-01" },
    { code: "MOMO-GC-002", amount: 250000, balance: 125000, status: "partially_redeemed", buyer: "Mary K.", recipient: "Peter K.", created: "2026-05-28" },
    { code: "MOMO-GC-003", amount: 300000, balance: 0, status: "redeemed", buyer: "Alice M.", recipient: "Bob M.", created: "2026-05-15" },
    { code: "MOMO-GC-004", amount: 100000, balance: 100000, status: "expired", buyer: "Sam W.", recipient: "Sarah W.", created: "2025-12-01" },
    { code: "MOMO-GC-005", amount: 50000, balance: 50000, status: "active", buyer: "Tom B.", recipient: "Harry B.", created: "2026-06-10" },
  ]);

  const [partners] = useState([
    { id: "p1", name: "Lake Malawi Tours", owner: "Mike C.", experiences: 3, revenue: 450000, status: "active", joined: "2026-01-15" },
    { id: "p2", name: "Blantyre Kitchen Co.", owner: "Grace M.", experiences: 2, revenue: 320000, status: "active", joined: "2026-02-20" },
    { id: "p3", name: "Vintage Lounge", owner: "Chimwemwe B.", experiences: 1, revenue: 185000, status: "pending", joined: "2026-06-05" },
    { id: "p4", name: "Lilongwe Adventures", owner: "Andrew K.", experiences: 4, revenue: 580000, status: "active", joined: "2026-01-10" },
    { id: "p5", name: "Safari Nights", owner: "Fiona L.", experiences: 2, revenue: 0, status: "suspended", joined: "2026-03-01" },
  ]);

  const [financials] = useState({
    totalRevenue: 2850000,
    monthlyRevenue: [{ month: "Jan", amount: 320000 }, { month: "Feb", amount: 410000 }, { month: "Mar", amount: 380000 }, { month: "Apr", amount: 520000 }, { month: "May", amount: 680000 }, { month: "Jun", amount: 540000 }],
    pendingPayouts: 425000,
    completedPayouts: 2100000,
    platformFee: 285000,
    refundedAmount: 45000,
  });

  const getToken = useCallback(() => localStorage.getItem("momento-auth-token"), []);

  const apiFetch = useCallback(async (url: string) => {
    const token = getToken();
    if (!token) throw new Error("No auth token");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) return null;
    return res.json();
  }, [getToken]);

  useEffect(() => {
    if (isAdmin) {
      loadSection("overview");
    }
  }, [isAdmin]);

  const loadSection = useCallback(async (s: Section) => {
    setLoading(true);
    try {
      switch (s) {
        case "overview": {
          const d = await apiFetch("/api/analytics/overview");
          if (d) setOverview(d);
          break;
        }
        case "users": {
          const d = await apiFetch("/api/users?limit=50");
          if (d) setUsers(d.users || []);
          break;
        }
        case "experiences": {
          const d = await apiFetch("/api/experiences?limit=50");
          if (d) setExperiences(d.experiences || []);
          break;
        }
        case "reviews": {
          const d = await apiFetch("/api/reviews?limit=50");
          if (d) setReviews(d.reviews || []);
          break;
        }
        case "testimonials": {
          const d = await apiFetch("/api/reviews?limit=50&status=approved");
          if (d) {
            setTestimonials(d.reviews || []);
            const saved = JSON.parse(localStorage.getItem("momento-featured-testimonials") || "[]");
            setFeaturedIds(saved);
          }
          break;
        }
        case "bookings": {
          const d = await apiFetch("/api/bookings?limit=50");
          if (d) setBookings(d.bookings || []);
          break;
        }
      }
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const switchSection = (s: Section) => {
    setSection(s);
    setSidebarOpen(false);
    loadSection(s);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      loadSection("users");
    } catch (e) { console.error(e); }
  };

  const handleExperienceStatus = async (expId: string, status: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`/api/admin/experiences/${expId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadSection("experiences");
    } catch (e) { console.error(e); }
  };

  const handleReviewStatus = async (reviewId: string, status: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadSection("reviews");
    } catch (e) { console.error(e); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#05070B] flex pt-18">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0F172A] border-r border-white/[0.08] transform transition-transform duration-300 lg:translate-x-0 pt-18 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF0F73] to-purple-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-body">A</span>
            </div>
            <div>
              <p className="text-body-sm font-bold text-[#F1F5F9]">Admin Panel</p>
              <p className="text-caption text-[#64748B]">Platform Management</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => switchSection(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all ${
                section === item.key ? "bg-[#FF0F73] text-white" : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.05]"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.08]">
          <Link href="/" className="flex items-center gap-2 text-caption text-[#64748B] hover:text-[#F1F5F9] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Platform
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <header className="sticky top-18 z-20 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.05] text-[#94A3B8] font-bold text-heading">â‰¡</button>
              <h1 className="text-heading-md font-bold text-[#F1F5F9] hidden sm:block">{NAV.find((n) => n.key === section)?.label}</h1>
            </div>
            <span className="text-caption text-[#64748B] bg-[#05070B] px-3 py-1.5 rounded-full">Admin</span>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
            </div>
          ) : (
            <>
              {/* Overview */}
              {section === "overview" && overview && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: "Total Users", value: overview.totalUsers.toLocaleString(), icon: "ðŸ‘¥" },
                      { label: "Partners", value: overview.totalPartners.toLocaleString(), icon: "ðŸ¤" },
                      { label: "Experiences", value: overview.totalExperiences.toLocaleString(), icon: "ðŸŽ¯" },
                      { label: "Total Bookings", value: overview.totalBookings.toLocaleString(), icon: "ðŸ“…" },
                      { label: "Pending", value: overview.pendingBookings.toLocaleString(), icon: "â³" },
                      { label: "Revenue", value: `MK ${overview.totalRevenue.toLocaleString()}`, icon: "ðŸ’°" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-5 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{stat.icon}</span>
                        </div>
                        <p className="text-heading-sm font-bold text-[#F1F5F9]">{stat.value}</p>
                        <p className="text-caption text-[#64748B]">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                    <p className="text-caption text-[#64748B] mb-2">Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {NAV.slice(1).map((item) => (
                        <button key={item.key} onClick={() => switchSection(item.key)} className="px-4 py-2 rounded-xl bg-[#05070B] text-body-sm text-[#94A3B8] hover:bg-[#FF0F73] hover:text-white transition-all">
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Users */}
              {section === "users" && (
                <div className="overflow-x-auto rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        {["Name", "Role", "Joined", "Actions"].map((h) => (
                          <th key={h} className="py-3 px-4 text-left text-caption text-[#64748B] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/[0.08] hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-4 text-body-sm text-[#F1F5F9]">{u.full_name || "â€”"}</td>
                          <td className="py-3 px-4"><StatusBadge status={u.role} /></td>
                          <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="px-2 py-1 rounded-lg text-caption border border-white/[0.08] focus:outline-none focus:border-[#FF0F73]"
                            >
                              {["user", "partner", "admin"].map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-caption text-[#64748B]">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Experiences */}
              {section === "experiences" && (
                <div className="overflow-x-auto rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        {["Title", "Category", "Price", "Status", "Bookings", "Rating", "Actions"].map((h) => (
                          <th key={h} className="py-3 px-4 text-left text-caption text-[#64748B] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {experiences.map((e) => (
                        <tr key={e.id} className="border-b border-white/[0.08] hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-4 text-body-sm text-[#F1F5F9] font-medium">{e.title}</td>
                          <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{e.category}</td>
                          <td className="py-3 px-4 text-body-sm text-[#F1F5F9]">MK {e.price.toLocaleString()}</td>
                          <td className="py-3 px-4"><StatusBadge status={e.status} /></td>
                          <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{e.booking_count}</td>
                          <td className="py-3 px-4 text-body-sm text-[#94A3B8]">â˜… {e.rating}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              {e.status !== "published" && (
                                <button onClick={() => handleExperienceStatus(e.id, "published")} className="px-2 py-1 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800/40">
                                  Publish
                                </button>
                              )}
                              {e.status !== "archived" && (
                                <button onClick={() => handleExperienceStatus(e.id, "archived")} className="px-2 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800/40">
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {experiences.length === 0 && (
                        <tr><td colSpan={7} className="py-8 text-center text-caption text-[#64748B]">No experiences found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Reviews */}
              {section === "reviews" && (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-body-sm font-medium text-[#F1F5F9]">{r.user?.full_name || "Anonymous"}</span>
                            <span className="text-caption text-[#64748B]">Â·</span>
                            <span className="text-caption text-[#64748B]">{'â˜…'.repeat(r.rating)}{'â˜†'.repeat(5 - r.rating)}</span>
                          </div>
                          <p className="text-caption text-[#64748B] mb-1">{r.experience?.title || "Unknown experience"}</p>
                          {r.body && <p className="text-body-sm text-[#94A3B8] mt-1">{r.body}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={r.status} />
                          {r.status === "pending" && (
                            <>
                              <button onClick={() => handleReviewStatus(r.id, "approved")} className="px-3 py-1 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800/40">
                                Approve
                              </button>
                              <button onClick={() => handleReviewStatus(r.id, "rejected")} className="px-3 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800/40">
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="py-8 text-center text-caption text-[#64748B]">No reviews found</div>
                  )}
                </div>
              )}

              {/* Testimonials */}
              {section === "testimonials" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-body-sm text-[#64748B]">
                      Feature approved reviews as testimonials on the home page.
                    </p>
                    <span className="text-caption text-[#94A3B8]">{featuredIds.length} featured</span>
                  </div>
                  {testimonials.map((r) => {
                    const featured = featuredIds.includes(r.id);
                    return (
                      <div key={r.id} className={`p-4 rounded-xl border shadow-sm transition-all ${
                        featured
                          ? "bg-[#1A0A1E] border-[#FF0F73]/30 ring-1 ring-[#FF0F73]/20"
                          : "bg-[#0F172A] border-white/[0.08]"
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-body-sm font-medium text-[#F1F5F9]">{r.user?.full_name || "Anonymous"}</span>
                              <span className="text-caption text-[#64748B]">Â·</span>
                              <span className="text-caption text-[#64748B]">{'â˜…'.repeat(r.rating)}{'â˜†'.repeat(5 - r.rating)}</span>
                            </div>
                            <p className="text-caption text-[#64748B] mb-1">{r.experience?.title || "Unknown experience"}</p>
                            {r.body && <p className="text-body-sm text-[#94A3B8] mt-1 line-clamp-2">{r.body}</p>}
                          </div>
                          <button
                            onClick={() => {
                              const next = featured
                                ? featuredIds.filter((id) => id !== r.id)
                                : [...featuredIds, r.id];
                              setFeaturedIds(next);
                              localStorage.setItem("momento-featured-testimonials", JSON.stringify(next));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-caption font-medium transition-all flex-shrink-0 ${
                              featured
                                ? "bg-[#FF0F73]/20 text-[#FF0F73] hover:bg-[#FF0F73]/30"
                                : "bg-white/[0.06] text-[#94A3B8] hover:bg-[#1A2332]"
                            }`}
                          >
                            {featured ? "â˜… Featured" : "â˜† Feature"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {testimonials.length === 0 && (
                    <div className="py-8 text-center text-caption text-[#64748B]">No approved reviews yet. Approve reviews first in the Reviews section.</div>
                  )}
                </div>
              )}

              {/* Bookings */}
              {section === "bookings" && (
                <div className="overflow-x-auto rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        {["ID", "Experience", "Date", "Guests", "Total", "Status", "Created"].map((h) => (
                          <th key={h} className="py-3 px-4 text-left text-caption text-[#64748B] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-white/[0.08] hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-4 text-body-sm text-[#F1F5F9] font-mono">{b.id.slice(0, 8)}</td>
                          <td className="py-3 px-4 text-body-sm text-[#F1F5F9]">{b.experience?.title || "â€”"}</td>
                          <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{b.experience_date}</td>
                          <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{b.guests_count}</td>
                          <td className="py-3 px-4 text-body-sm text-[#F1F5F9] font-medium">MK {b.total_price.toLocaleString()}</td>
                          <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                          <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{new Date(b.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr><td colSpan={7} className="py-8 text-center text-caption text-[#64748B]">No bookings found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Gift Cards */}
              {section === "gift-cards" && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Cards", value: giftCards.length, icon: "ðŸŽ" },
                      { label: "Active", value: giftCards.filter(g => g.status === "active").length, icon: "âœ…" },
                      { label: "Partially Redeemed", value: giftCards.filter(g => g.status === "partially_redeemed").length, icon: "ðŸ”„" },
                      { label: "Redeemed", value: giftCards.filter(g => g.status === "redeemed").length, icon: "âœ”ï¸" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xl">{stat.icon}</span>
                        </div>
                        <p className="text-heading-sm font-bold text-[#F1F5F9]">{stat.value}</p>
                        <p className="text-caption text-[#64748B]">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          {["Code", "Amount", "Balance", "Status", "Buyer", "Recipient", "Created"].map((h) => (
                            <th key={h} className="py-3 px-4 text-left text-caption text-[#64748B] font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {giftCards.map((gc) => (
                          <tr key={gc.code} className="border-b border-white/[0.08] hover:bg-white/[0.03] transition-colors">
                            <td className="py-3 px-4 text-body-sm font-mono text-[#F1F5F9] font-medium">{gc.code}</td>
                            <td className="py-3 px-4 text-body-sm text-[#F1F5F9]">MK {gc.amount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-body-sm text-[#F1F5F9]">MK {gc.balance.toLocaleString()}</td>
                            <td className="py-3 px-4"><StatusBadge status={gc.status} /></td>
                            <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{gc.buyer}</td>
                            <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{gc.recipient}</td>
                            <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{gc.created}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Partners */}
              {section === "partners" && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Partners", value: partners.length, icon: "ðŸ¤" },
                      { label: "Active", value: partners.filter(p => p.status === "active").length, icon: "âœ…" },
                      { label: "Pending", value: partners.filter(p => p.status === "pending").length, icon: "â³" },
                      { label: "Suspended", value: partners.filter(p => p.status === "suspended").length, icon: "â›”" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xl">{stat.icon}</span>
                        </div>
                        <p className="text-heading-sm font-bold text-[#F1F5F9]">{stat.value}</p>
                        <p className="text-caption text-[#64748B]">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          {["Partner", "Owner", "Experiences", "Revenue", "Status", "Joined", "Actions"].map((h) => (
                            <th key={h} className="py-3 px-4 text-left text-caption text-[#64748B] font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {partners.map((p) => (
                          <tr key={p.id} className="border-b border-white/[0.08] hover:bg-white/[0.03] transition-colors">
                            <td className="py-3 px-4 text-body-sm text-[#F1F5F9] font-medium">{p.name}</td>
                            <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{p.owner}</td>
                            <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{p.experiences}</td>
                            <td className="py-3 px-4 text-body-sm text-[#F1F5F9]">MK {p.revenue.toLocaleString()}</td>
                            <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                            <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{p.joined}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <button className="px-2 py-1 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800/40">View</button>
                                <button className="px-2 py-1 rounded-lg bg-amber-900/30 text-amber-400 text-caption hover:bg-amber-800/40">Contact</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financials */}
              {section === "financials" && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Revenue", value: `MK ${financials.totalRevenue.toLocaleString()}`, icon: "ðŸ’°", accent: "text-emerald-400" },
                      { label: "Pending Payouts", value: `MK ${financials.pendingPayouts.toLocaleString()}`, icon: "â³", accent: "text-amber-400" },
                      { label: "Completed Payouts", value: `MK ${financials.completedPayouts.toLocaleString()}`, icon: "âœ…", accent: "text-blue-400" },
                      { label: "Platform Fees", value: `MK ${financials.platformFee.toLocaleString()}`, icon: "ðŸ“Š", accent: "text-purple-400" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-5 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{stat.icon}</span>
                        </div>
                        <p className={`text-heading-sm font-bold ${stat.accent}`}>{stat.value}</p>
                        <p className="text-caption text-[#64748B]">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Monthly Revenue Chart */}
                  <div className="rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm p-5">
                    <h3 className="text-body-sm font-semibold text-[#F1F5F9] mb-4">Monthly Revenue (2026)</h3>
                    <div className="flex items-end gap-3 h-40">
                      {financials.monthlyRevenue.map((m) => {
                        const maxRevenue = Math.max(...financials.monthlyRevenue.map(r => r.amount));
                        const height = (m.amount / maxRevenue) * 100;
                        return (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-[#94A3B8] font-medium">MK {(m.amount / 1000).toFixed(0)}k</span>
                            <div
                              className="w-full rounded-lg bg-gradient-to-t from-[#FF0F73] via-[#A855F7] to-[#6366F1] transition-all duration-500 hover:opacity-80"
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-[10px] text-[#64748B]">{m.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                      <h3 className="text-body-sm font-semibold text-[#F1F5F9] mb-2">Refunds</h3>
                      <p className="text-heading-sm font-bold text-red-400">MK {financials.refundedAmount.toLocaleString()}</p>
                      <p className="text-caption text-[#64748B]">Total refunded amount</p>
                    </div>
                    <div className="p-5 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                      <h3 className="text-body-sm font-semibold text-[#F1F5F9] mb-2">Net Revenue</h3>
                      <p className="text-heading-sm font-bold text-[#F1F5F9]">MK {(financials.totalRevenue - financials.refundedAmount).toLocaleString()}</p>
                      <p className="text-caption text-[#64748B]">After refunds</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings */}
              {section === "settings" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                    <h3 className="text-body-sm font-semibold text-[#F1F5F9] mb-3">Platform Info</h3>
                    <div className="space-y-2 text-body-sm text-[#94A3B8]">
                      <p>Version: 1.0.0</p>
                      <p>Environment: {process.env.NODE_ENV}</p>
                      <p>Database: Supabase (PostgreSQL)</p>
                      <p>Auth: Supabase Auth</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
                    <h3 className="text-body-sm font-semibold text-[#F1F5F9] mb-3">Admin Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => switchSection("users")} className="px-4 py-2 rounded-xl bg-[#05070B] text-body-sm text-[#94A3B8] hover:bg-[#1A2332] transition-all border border-white/[0.08]">Manage Users</button>
                      <button onClick={() => switchSection("reviews")} className="px-4 py-2 rounded-xl bg-[#05070B] text-body-sm text-[#94A3B8] hover:bg-[#1A2332] transition-all border border-white/[0.08]">Moderate Reviews</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
