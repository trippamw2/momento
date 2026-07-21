"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { transformExperience } from "@/lib/transform";
import OverviewSection from "./OverviewSection";
import CustomerInsightsSection from "./CustomerInsightsSection";
import NotificationsSection from "./NotificationsSection";
import StatusBadge from "./StatusBadge";
import BookingRow from "./BookingRow";
import MiniBar from "./MiniBar";
import CalendarWidget from "./CalendarWidget";
import ExperienceForm from "./ExperienceForm";
import type { Experience } from "@/lib/types";

// ─── Types ───

type DashSection =
  | "overview"
  | "experiences"
  | "availability"
  | "bookings"
  | "customers"
  | "payouts"
  | "reports"
  | "notifications";

type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled";

interface BookingSummary {
  id: string;
  customer: string;
  experience: string;
  date: string;
  guests: number;
  total: number;
  status: BookingStatus;
}

interface PayoutSummary {
  id: string;
  period: string;
  amount: number;
  status: "paid" | "pending";
  date: string;
}

interface PartnerExperience {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  price: number;
  rating: number;
  category: string;
  location: string;
  mood: string[];
  bookedCount: number;
  revenue: number;
}

// ─── Constants ───

const partnerTypes = ["Wellness", "Dining", "Adventure", "Luxury", "Entertainment"];

const nav: { key: DashSection; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "experiences", label: "Manage Experiences" },
  { key: "availability", label: "Manage Availability" },
  { key: "bookings", label: "Manage Bookings" },
  { key: "customers", label: "Customer Insights" },
  { key: "payouts", label: "Payouts" },
  { key: "reports", label: "Reports" },
  { key: "notifications", label: "Notifications" },
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("experio-auth-token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PartnerDashboard() {
  const [section, setSection] = useState<DashSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [partnerType, setPartnerType] = useState("All Types");
  const [bookingFilter, setBookingFilter] = useState<"all" | BookingStatus>("all");
  const [toast, setToast] = useState("");

  // API data states — all default to empty/zero, NO mock fallbacks
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [payouts, setPayouts] = useState<PayoutSummary[]>([]);
  const [partnerExperiences, setPartnerExperiences] = useState<PartnerExperience[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<number[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setDataLoading(true);
      const headers = authHeaders();

      // Fetch everything simultaneously — no mock fallbacks
      const [bRes, pRes, eRes, xRes, oRes] = await Promise.allSettled([
        fetch("/api/bookings/partner", { headers }),
        fetch("/api/partners/payouts", { headers }),
        fetch("/api/partners/earnings", { headers }),
        fetch("/api/experiences/partner", { headers }),
        fetch("/api/analytics/overview", { headers }),
      ]);

      // ── Bookings ──
      if (bRes.status === "fulfilled" && bRes.value.ok) {
        try {
          const data = await bRes.value.json();
          const list = data.bookings || [];
          setBookings(
            (Array.isArray(list) ? list : []).map((b: Record<string, unknown>) => ({
              id: (b.id as string) || "",
              customer: ((b.user as Record<string, unknown>)?.full_name as string) || "Guest",
              experience: ((b.experience as Record<string, unknown>)?.title as string) || "Experience",
              date: (b.experience_date as string) || "",
              guests: (b.guests_count as number) || 1,
              total: (b.total_price as number) || 0,
              status: (b.status as BookingStatus) || "pending",
            }))
          );
        } catch { /* empty */ }
      }

      // ── Payouts ──
      if (pRes.status === "fulfilled" && pRes.value.ok) {
        try {
          const data = await pRes.value.json();
          const list = data.payouts || [];
          setPayouts(
            (Array.isArray(list) ? list : []).map((p: Record<string, unknown>) => ({
              id: (p.id as string) || "",
              period: (p.created_at as string)?.slice(0, 7) || "",
              amount: (p.amount as number) || 0,
              status: (p.status as "paid" | "pending") === "paid" ? "paid" : "pending",
              date: (p.created_at as string)?.slice(0, 10) || "",
            }))
          );
        } catch { /* empty */ }
      }

      // ── Earnings ──
      if (eRes.status === "fulfilled" && eRes.value.ok) {
        try {
          const data = await eRes.value.json();
          setTotalRevenue(data.total_earned || 0);
          // We don't have weekly/monthly breakdown from API — leave as empty arrays
          // Charts will show empty bars when no data available
        } catch { /* empty */ }
      }

      // ── Partner Experiences ──
      let fetchedExperienceIds: string[] = [];
      if (xRes.status === "fulfilled" && xRes.value.ok) {
        try {
          const data = await xRes.value.json();
          const list = data.experiences || [];
          if (Array.isArray(list) && list.length > 0) {
            const transformed = list.map((exp: Record<string, unknown>) => {
              const t: Experience = transformExperience(exp);
              return {
                id: t.id,
                title: t.title,
                subtitle: t.subtitle,
                image: t.image,
                price: t.price,
                rating: t.rating,
                category: t.category,
                location: t.location,
                mood: t.mood,
                bookedCount: 0,
                revenue: 0,
              };
            });
            setPartnerExperiences(transformed);
            fetchedExperienceIds = list.map((e: Record<string, unknown>) => e.id as string);
          }
        } catch { /* empty */ }
      }

      // ── Compute booking counts per experience ──
      if (fetchedExperienceIds.length > 0) {
        setPartnerExperiences((prev) => {
          const expBookings = bookings.filter((b) =>
            fetchedExperienceIds.includes(b.id) || prev.some((p) => p.title === b.experience)
          );
          return prev.map((exp) => {
            const expB = bookings.filter((b) => b.experience === exp.title);
            return {
              ...exp,
              bookedCount: expB.length,
              revenue: expB.reduce((s, b) => s + b.total, 0),
            };
          });
        });
      }

      // ── Overview / customers from analytics ──
      if (oRes.status === "fulfilled" && oRes.value.ok) {
        try {
          const data = await oRes.value.json();
          setTotalCustomers(data.totalBookings || 0);
          // totalViews, conversionRate not available from analytics — leave as 0
        } catch { /* empty */ }
      }

      setDataLoading(false);
    };

    fetchAll();
  }, []);

  // Recompute per-experience stats when bookings arrive
  useEffect(() => {
    if (partnerExperiences.length > 0 && bookings.length > 0) {
      setPartnerExperiences((prev) =>
        prev.map((exp) => {
          const expB = bookings.filter((b) => b.experience === exp.title);
          return {
            ...exp,
            bookedCount: expB.length,
            revenue: expB.reduce((s, b) => s + b.total, 0),
          };
        })
      );
    }
  }, [bookings, partnerExperiences.length]);

  const activeBookings = bookings.filter((b) => b.status === "confirmed").length;

  const popularExperiences = useMemo(() => {
    const bookingCounts: Record<string, number> = {};
    bookings.forEach((b) => {
      bookingCounts[b.experience] = (bookingCounts[b.experience] || 0) + 1;
    });
    return [...partnerExperiences]
      .sort((a, b) => (bookingCounts[b.title] || 0) - (bookingCounts[a.title] || 0))
      .slice(0, 5);
  }, [bookings, partnerExperiences]);

  const filteredBookings = useMemo(
    () => bookingFilter === "all" ? bookings : bookings.filter((b) => b.status === bookingFilter),
    [bookings, bookingFilter]
  );

  const handleDownloadReport = useCallback((reportName: string) => {
    showToast(`"${reportName}" download started`);
  }, [showToast]);

  const handleExportFullReport = useCallback(() => {
    showToast("Full report export initiated");
  }, [showToast]);

  const handleSaveAvailability = useCallback(() => {
    showToast("Availability saved");
  }, [showToast]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#ebebeb] transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-5 border-b border-[#ebebeb]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF0F73] flex items-center justify-center shadow-[0_4px_12px_rgba(255, 15, 115, 0.2)]">
              <span className="text-white font-bold text-body">M</span>
            </div>
            <div>
              <p className="text-body-sm font-bold text-[#222222]">Experio</p>
              <p className="text-caption text-[#929292]">Partner Dashboard</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); setSidebarOpen(false); }}
              className={`w-full px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all ${
                section === item.key ? "bg-[#FF0F73] text-white" : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#ebebeb]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FF0F73] flex items-center justify-center text-white text-body-sm font-bold">LC</div>
            <div>
              <p className="text-body-sm font-medium text-[#222222]">Lilongwe Co.</p>
              <p className="text-caption text-[#929292]">Premium Partner</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-[#ebebeb]">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f7f7f7] text-[#6a6a6a] font-bold text-heading">=</button>
              <h1 className="text-heading-md font-bold text-[#222222] hidden sm:block">{nav.find((n) => n.key === section)?.label}</h1>
            </div>
            <div className="flex items-center gap-3">
              <select value={partnerType} onChange={(e) => setPartnerType(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white text-[#6a6a6a] text-caption border border-[#dddddd] focus:outline-none focus:border-[#FF0F73]/50 appearance-none cursor-pointer">
                <option>All Types</option>
                {partnerTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#FF0F73] flex items-center justify-center text-white text-body-sm font-bold cursor-pointer">LC</div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {section === "overview" && (
            <OverviewSection totalRevenue={totalRevenue} activeBookings={activeBookings} conversionRate={conversionRate}
              totalViews={totalViews} weeklyRevenue={weeklyRevenue} popularExperiences={popularExperiences} recentBookings={bookings} />
          )}

          {section === "experiences" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-body-sm text-[#6a6a6a]">{dataLoading ? "Loading..." : `${partnerExperiences.length} experiences`}</p>
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF0F73] text-white text-body-sm font-medium hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Experience
                </button>
              </div>
              {partnerExperiences.length === 0 && !dataLoading ? (
                <div className="py-12 text-center text-body-sm text-[#929292] bg-white rounded-xl border border-[#ebebeb]">
                  No experiences yet. Click "Add Experience" to create your first one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partnerExperiences.map((exp) => (
                    <div key={exp.id} className="flex gap-4 p-4 rounded-xl bg-white border border-[#ebebeb] group hover:border-[#dddddd] transition-all shadow-sm">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={exp.image} alt={exp.title} fill className="object-cover" sizes="96px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-body-sm font-semibold text-[#222222] truncate">{exp.title}</h3>
                            <p className="text-caption text-[#929292] mt-0.5">{exp.category} · {exp.location}</p>
                          </div>
                          <span className="text-caption font-medium text-[#222222] whitespace-nowrap">MK {exp.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-caption text-[#929292]">
                          <span>★ {exp.rating}</span>
                          <span>📅 {exp.bookedCount} bookings</span>
                          <span>💰 MK {exp.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => showToast("Editing experience...")} className="px-3 py-1 rounded-lg bg-[#f7f7f7] text-[#6a6a6a] text-caption hover:bg-[#f0f0f0] transition-colors">Edit</button>
                          <button onClick={() => showToast(`Viewing performance for "${exp.title}"`)} className="px-3 py-1 rounded-lg bg-[#f7f7f7] text-[#6a6a6a] text-caption hover:bg-[#f0f0f0] transition-colors">Performance</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showForm && <ExperienceForm onClose={() => setShowForm(false)} />}
            </div>
          )}

          {section === "availability" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-body-sm text-[#6a6a6a]">Toggle dates to block availability</p>
                <button onClick={handleSaveAvailability} className="px-4 py-2 rounded-xl bg-[#FF0F73] text-white text-body-sm font-medium hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all">Save Changes</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map((offset) => {
                  const d = new Date(); d.setMonth(d.getMonth() + offset);
                  return (
                    <div key={offset}>
                      <p className="text-body-sm font-semibold text-[#222222] mb-3 text-center">
                        {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} {d.getFullYear()}
                      </p>
                      <CalendarWidget />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {section === "bookings" && (
            <div>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {(["all","confirmed","pending","completed","cancelled"] as const).map((f) => (
                  <button key={f} onClick={() => setBookingFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-caption font-medium capitalize transition-all ${bookingFilter === f ? "bg-[#FF0F73] text-white" : "bg-white text-[#6a6a6a] border border-[#dddddd] hover:bg-[#f7f7f7]"}`}>{f}</button>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#ebebeb]">
                      {["ID","Customer","Experience","Date","Guests","Total","Status"].map((h) => (
                        <th key={h} className="py-3 px-3 text-left text-caption text-[#929292] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      <tr><td colSpan={7} className="py-8 text-center text-caption text-[#929292]">Loading bookings...</td></tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-caption text-[#929292]">No bookings found</td></tr>
                    ) : (filteredBookings.map((b) => (<BookingRow key={b.id} booking={b} />)))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === "customers" && <CustomerInsightsSection totalCustomers={totalCustomers} />}

          {section === "payouts" && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Earned", value: `MK ${totalRevenue.toLocaleString()}` },
                  { label: "This Month", value: `MK ${(monthlyRevenue.length > 0 ? monthlyRevenue[monthlyRevenue.length - 1] : 0).toLocaleString()}` },
                  { label: "Pending", value: `MK ${payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0).toLocaleString()}` },
                  { label: "Next Payout", value: "—" },
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                    <p className="text-caption text-[#929292] mb-1">{s.label}</p>
                    <p className="text-heading-sm font-bold text-[#222222]">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl bg-white border border-[#ebebeb] shadow-sm mb-6">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[#ebebeb]">
                      {["ID","Period","Amount","Status","Paid Date"].map((h) => (
                        <th key={h} className="py-3 px-4 text-left text-caption text-[#929292] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      <tr><td colSpan={5} className="py-8 text-center text-caption text-[#929292]">Loading payouts...</td></tr>
                    ) : payouts.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-caption text-[#929292]">No payouts yet</td></tr>
                    ) : (payouts.map((p) => (
                      <tr key={p.id} className="border-b border-[#ebebeb] hover:bg-[#fafafa] transition-colors">
                        <td className="py-3 px-4 text-body-sm text-[#222222]">{p.id?.slice(0, 8) || "—"}</td>
                        <td className="py-3 px-4 text-body-sm text-[#6a6a6a]">{p.period}</td>
                        <td className="py-3 px-4 text-body-sm text-[#222222] font-medium">MK {p.amount.toLocaleString()}</td>
                        <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                        <td className="py-3 px-4 text-body-sm text-[#6a6a6a]">{p.date || "—"}</td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                <h3 className="text-body-sm font-semibold text-[#222222] mb-3">Payout Info</h3>
                <p className="text-caption text-[#929292] mb-4">Payouts are processed bi-monthly on the 5th and 20th. Minimum payout threshold is MK 50,000.</p>
                <div className="flex items-center gap-2 mt-4 text-caption text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg w-fit border border-emerald-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  All required documents verified
                </div>
              </div>
            </div>
          )}

          {section === "reports" && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Revenue Report", desc: "Monthly revenue breakdown with trends and forecasts", color: "bg-[#FF0F73]" },
                  { label: "Bookings Report", desc: "Booking volumes, status distribution, and peak periods", color: "bg-purple-500" },
                  { label: "Customer Report", desc: "Customer acquisition, retention, and lifetime value", color: "bg-cyan-500" },
                  { label: "Performance Report", desc: "Experience ratings, reviews, and popularity scores", color: "bg-amber-500" },
                ].map((r) => (
                  <div key={r.label} className="p-5 rounded-xl bg-white border border-[#ebebeb] hover:border-[#dddddd] transition-all group shadow-sm">
                    <div className={`w-10 h-10 rounded-lg ${r.color} flex items-center justify-center mb-3`}>
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h3 className="text-body-sm font-semibold text-[#222222] mb-1">{r.label}</h3>
                    <p className="text-caption text-[#929292] mb-3 leading-relaxed">{r.desc}</p>
                    <button onClick={() => handleDownloadReport(r.label)}
                      className="text-caption font-medium text-[#FF0F73] hover:text-[#e0314f] transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      Download Report
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                  <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Monthly Revenue Trend</h3>
                  {monthlyRevenue.length > 0 ? (
                    <>
                      <MiniBar data={monthlyRevenue} height={120} />
                      <div className="flex justify-between mt-2">{MONTHS_SHORT.map((m) => (<span key={m} className="text-caption text-[#929292]">{m}</span>))}</div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[120px] text-caption text-[#929292]">No revenue data available yet</div>
                  )}
                </div>
                <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
                  <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Bookings Overview</h3>
                  {bookings.length > 0 ? (
                    <div className="space-y-4">
                      {(["confirmed","completed","pending","cancelled"] as const).map((status) => {
                        const count = bookings.filter((b) => b.status === status).length;
                        const pct = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0;
                        const colors: Record<string, string> = { confirmed: "from-emerald-400 to-emerald-500", completed: "from-blue-400 to-blue-500", pending: "from-amber-400 to-amber-500", cancelled: "from-red-400 to-red-500" };
                        const label = status.charAt(0).toUpperCase() + status.slice(1);
                        return (
                          <div key={status}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-caption text-[#6a6a6a]">{label}</span>
                              <span className="text-caption text-[#222222] font-medium">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#ebebeb] overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${colors[status]}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[120px] text-caption text-[#929292]">No booking data available yet</div>
                  )}
                  <button onClick={handleExportFullReport} className="w-full mt-4 py-2 rounded-lg bg-[#f7f7f7] text-[#6a6a6a] text-caption font-medium hover:bg-[#f0f0f0] transition-colors flex items-center justify-center gap-1.5 border border-[#ebebeb]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export Full Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === "notifications" && <NotificationsSection />}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#222222] text-white text-sm font-medium shadow-xl border border-white/[0.06] transition-all">
          {toast}
        </div>
      )}
    </div>
  );
}
