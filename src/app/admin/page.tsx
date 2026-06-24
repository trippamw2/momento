"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Section = "overview" | "users" | "experiences" | "reviews" | "bookings" | "settings";

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
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "users", label: "Users", icon: "👥" },
  { key: "experiences", label: "Experiences", icon: "🎯" },
  { key: "reviews", label: "Reviews", icon: "⭐" },
  { key: "bookings", label: "Bookings", icon: "📅" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    published: "bg-emerald-100 text-emerald-700",
    draft: "bg-gray-100 text-gray-700",
    archived: "bg-red-100 text-red-700",
    paused: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-caption font-medium capitalize ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [experiences, setExperiences] = useState<ExpRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const getToken = useCallback(() => localStorage.getItem("momento-auth-token"), []);

  const apiFetch = useCallback(async (url: string) => {
    const token = getToken();
    if (!token) throw new Error("No auth token");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) { setIsAdmin(false); return null; }
    return res.json();
  }, [getToken]);

  useEffect(() => {
    const role = localStorage.getItem("momento-user-role");
    if (role !== "admin") { router.push("/"); return; }
    setIsAdmin(true);
    loadSection("overview");
  }, []);

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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex pt-18">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#ebebeb] transform transition-transform duration-300 lg:translate-x-0 pt-18 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-[#ebebeb]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff385c] to-purple-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-body">A</span>
            </div>
            <div>
              <p className="text-body-sm font-bold text-[#222222]">Admin Panel</p>
              <p className="text-caption text-[#929292]">Platform Management</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => switchSection(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all ${
                section === item.key ? "bg-[#ff385c] text-white" : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#ebebeb]">
          <Link href="/" className="flex items-center gap-2 text-caption text-[#929292] hover:text-[#222222] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Platform
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <header className="sticky top-18 z-20 bg-white/80 backdrop-blur-xl border-b border-[#ebebeb]">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f7f7f7] text-[#6a6a6a] font-bold text-heading">≡</button>
              <h1 className="text-heading-md font-bold text-[#222222] hidden sm:block">{NAV.find((n) => n.key === section)?.label}</h1>
            </div>
            <span className="text-caption text-[#929292] bg-[#f7f7f7] px-3 py-1.5 rounded-full">Admin</span>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#ff385c]/30 border-t-[#ff385c] animate-spin" />
            </div>
          ) : (
            <>
              {/* Overview */}
              {section === "overview" && overview && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: "Total Users", value: overview.totalUsers.toLocaleString(), icon: "👥" },
                      { label: "Partners", value: overview.totalPartners.toLocaleString(), icon: "🤝" },
                      { label: "Experiences", value: overview.totalExperiences.toLocaleString(), icon: "🎯" },
                      { label: "Total Bookings", value: overview.totalBookings.toLocaleString(), icon: "📅" },
                      { label: "Pending", value: overview.pendingBookings.toLocaleString(), icon: "⏳" },
                      { label: "Revenue", value: `MK ${overview.totalRevenue.toLocaleString()}`, icon: "💰" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{stat.icon}</span>
                        </div>
                        <p className="text-heading-sm font-bold text-[#222222]">{stat.value}</p>
                        <p className="text-caption text-[#929292]">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                    <p className="text-caption text-[#929292] mb-2">Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {NAV.slice(1).map((item) => (
                        <button key={item.key} onClick={() => switchSection(item.key)} className="px-4 py-2 rounded-xl bg-[#f7f7f7] text-body-sm text-[#6a6a6a] hover:bg-[#ff385c] hover:text-white transition-all">
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Users */}
              {section === "users" && (
                <div className="overflow-x-auto rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-[#ebebeb]">
                        {["Name", "Role", "Joined", "Actions"].map((h) => (
                          <th key={h} className="py-3 px-4 text-left text-caption text-[#929292] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-[#ebebeb] hover:bg-[#fafafa] transition-colors">
                          <td className="py-3 px-4 text-body-sm text-[#222222]">{u.full_name || "—"}</td>
                          <td className="py-3 px-4"><StatusBadge status={u.role} /></td>
                          <td className="py-3 px-4 text-body-sm text-[#6a6a6a]">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="px-2 py-1 rounded-lg text-caption border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
                            >
                              {["user", "partner", "admin"].map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-caption text-[#929292]">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Experiences */}
              {section === "experiences" && (
                <div className="overflow-x-auto rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[#ebebeb]">
                        {["Title", "Category", "Price", "Status", "Bookings", "Rating", "Actions"].map((h) => (
                          <th key={h} className="py-3 px-4 text-left text-caption text-[#929292] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {experiences.map((e) => (
                        <tr key={e.id} className="border-b border-[#ebebeb] hover:bg-[#fafafa] transition-colors">
                          <td className="py-3 px-4 text-body-sm text-[#222222] font-medium">{e.title}</td>
                          <td className="py-3 px-4 text-body-sm text-[#6a6a6a]">{e.category}</td>
                          <td className="py-3 px-4 text-body-sm text-[#222222]">MK {e.price.toLocaleString()}</td>
                          <td className="py-3 px-4"><StatusBadge status={e.status} /></td>
                          <td className="py-3 px-4 text-body-sm text-[#6a6a6a]">{e.booking_count}</td>
                          <td className="py-3 px-4 text-body-sm text-[#6a6a6a]">★ {e.rating}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              {e.status !== "published" && (
                                <button onClick={() => handleExperienceStatus(e.id, "published")} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-caption hover:bg-emerald-100">
                                  Publish
                                </button>
                              )}
                              {e.status !== "archived" && (
                                <button onClick={() => handleExperienceStatus(e.id, "archived")} className="px-2 py-1 rounded-lg bg-red-50 text-red-500 text-caption hover:bg-red-100">
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {experiences.length === 0 && (
                        <tr><td colSpan={7} className="py-8 text-center text-caption text-[#929292]">No experiences found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Reviews */}
              {section === "reviews" && (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-body-sm font-medium text-[#222222]">{r.user?.full_name || "Anonymous"}</span>
                            <span className="text-caption text-[#929292]">·</span>
                            <span className="text-caption text-[#929292]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                          </div>
                          <p className="text-caption text-[#929292] mb-1">{r.experience?.title || "Unknown experience"}</p>
                          {r.body && <p className="text-body-sm text-[#6a6a6a] mt-1">{r.body}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={r.status} />
                          {r.status === "pending" && (
                            <>
                              <button onClick={() => handleReviewStatus(r.id, "approved")} className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-caption hover:bg-emerald-100">
                                Approve
                              </button>
                              <button onClick={() => handleReviewStatus(r.id, "rejected")} className="px-3 py-1 rounded-lg bg-red-50 text-red-500 text-caption hover:bg-red-100">
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="py-8 text-center text-caption text-[#929292]">No reviews found</div>
                  )}
                </div>
              )}

              {/* Bookings */}
              {section === "bookings" && (
                <div className="overflow-x-auto rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[#ebebeb]">
                        {["ID", "Experience", "Date", "Guests", "Total", "Status", "Created"].map((h) => (
                          <th key={h} className="py-3 px-4 text-left text-caption text-[#929292] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-[#ebebeb] hover:bg-[#fafafa] transition-colors">
                          <td className="py-3 px-4 text-body-sm text-[#222222] font-mono">{b.id.slice(0, 8)}</td>
                          <td className="py-3 px-4 text-body-sm text-[#222222]">{b.experience?.title || "—"}</td>
                          <td className="py-3 px-4 text-body-sm text-[#6a6a6a]">{b.experience_date}</td>
                          <td className="py-3 px-4 text-body-sm text-[#6a6a6a]">{b.guests_count}</td>
                          <td className="py-3 px-4 text-body-sm text-[#222222] font-medium">MK {b.total_price.toLocaleString()}</td>
                          <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                          <td className="py-3 px-4 text-body-sm text-[#6a6a6a]">{new Date(b.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr><td colSpan={7} className="py-8 text-center text-caption text-[#929292]">No bookings found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Settings */}
              {section === "settings" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                    <h3 className="text-body-sm font-semibold text-[#222222] mb-3">Platform Info</h3>
                    <div className="space-y-2 text-body-sm text-[#6a6a6a]">
                      <p>Version: 1.0.0</p>
                      <p>Environment: {process.env.NODE_ENV}</p>
                      <p>Database: Supabase (PostgreSQL)</p>
                      <p>Auth: Supabase Auth</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                    <h3 className="text-body-sm font-semibold text-[#222222] mb-3">Admin Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => switchSection("users")} className="px-4 py-2 rounded-xl bg-[#f7f7f7] text-body-sm text-[#6a6a6a] hover:bg-[#f0f0f0] transition-all border border-[#ebebeb]">Manage Users</button>
                      <button onClick={() => switchSection("reviews")} className="px-4 py-2 rounded-xl bg-[#f7f7f7] text-body-sm text-[#6a6a6a] hover:bg-[#f0f0f0] transition-all border border-[#ebebeb]">Moderate Reviews</button>
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
