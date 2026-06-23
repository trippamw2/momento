"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { experiences } from "@/lib/data";

type DashSection =
  | "overview"
  | "experiences"
  | "availability"
  | "bookings"
  | "customers"
  | "payouts"
  | "reports"
  | "notifications";

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

const mockBookings = [
  { id: "B-1001", customer: "Chimwemwe Banda", experience: "Sunset Cruise", date: "2026-06-28", guests: 2, total: 110000, status: "confirmed" as const },
  { id: "B-1002", customer: "Temwa Phiri", experience: "Spa Day", date: "2026-06-25", guests: 1, total: 85000, status: "completed" as const },
  { id: "B-1003", customer: "Zione Mwale", experience: "Date Night", date: "2026-07-02", guests: 2, total: 130000, status: "confirmed" as const },
  { id: "B-1004", customer: "Kondwani Nkhoma", experience: "Brunch Experience", date: "2026-06-20", guests: 4, total: 140000, status: "completed" as const },
  { id: "B-1005", customer: "Thandiwe Banda", experience: "Girls Day Out", date: "2026-07-05", guests: 3, total: 165000, status: "pending" as const },
  { id: "B-1006", customer: "Mphatso Kachale", experience: "Rooftop Dining", date: "2026-06-22", guests: 2, total: 150000, status: "cancelled" as const },
  { id: "B-1007", customer: "Grace Nyirenda", experience: "Staycation", date: "2026-07-10", guests: 2, total: 360000, status: "pending" as const },
  { id: "B-1008", customer: "Peter Banda", experience: "Adventure Day", date: "2026-06-30", guests: 3, total: 210000, status: "confirmed" as const },
  { id: "B-1009", customer: "Mary Kamanga", experience: "Wine & Dine", date: "2026-07-08", guests: 2, total: 80000, status: "confirmed" as const },
  { id: "B-1010", customer: "John Nyirenda", experience: "Couples Massage", date: "2026-06-26", guests: 2, total: 110000, status: "completed" as const },
];

const mockPayouts = [
  { id: "PO-001", period: "1-15 Jun 2026", amount: 845000, status: "paid" as const, date: "2026-06-18" },
  { id: "PO-002", period: "16-31 May 2026", amount: 1230000, status: "paid" as const, date: "2026-06-05" },
  { id: "PO-003", period: "1-15 May 2026", amount: 675000, status: "paid" as const, date: "2026-05-20" },
  { id: "PO-004", period: "16-30 Apr 2026", amount: 920000, status: "paid" as const, date: "2026-05-05" },
  { id: "PO-005", period: "1-15 Jun 2026", amount: 450000, status: "pending" as const, date: "2026-07-05" },
];

const mockNotifications = [
  { id: "N1", title: "New booking received", desc: "Chimwemwe Banda booked Sunset Cruise", time: "12m ago", read: false },
  { id: "N2", title: "Review alert", desc: "New 5-star review on Spa Day", time: "2h ago", read: false },
  { id: "N3", title: "Payout processed", desc: "MK 845,000 sent to your account", time: "1d ago", read: false },
  { id: "N4", title: "Experience suggestion", desc: "Pool & Lunch is trending — consider adding slots", time: "2d ago", read: true },
  { id: "N5", title: "Weekly report ready", desc: "Your performance summary for Jun 14-20", time: "3d ago", read: true },
  { id: "N6", title: "Cancellation notice", desc: "Rooftop Dining booking cancelled by guest", time: "4d ago", read: true },
];

const weeklyRevenue = [320000, 480000, 560000, 720000, 610000, 890000, 945000];
const monthlyRevenue = [2100000, 2850000, 3200000, 4100000, 3800000, 5200000];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function KpiCard({ label, value, trend, icon }: { label: string; value: string; trend?: string; icon: string }) {
  return (
    <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06] hover:border-white/[0.12] transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className="text-caption font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            +{trend}
          </span>
        )}
      </div>
      <p className="text-heading-lg font-bold text-white mb-0.5">{value}</p>
      <p className="text-caption text-[#6B7280]">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    pending: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    completed: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    cancelled: "bg-red-400/10 text-red-400 border-red-400/20",
    paid: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-caption font-medium capitalize border ${colors[status] || "bg-[#111827] text-[#6B7280]"}`}>
      {status}
    </span>
  );
}

function BookingRow({ booking }: { booking: typeof mockBookings[0] }) {
  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-2 text-body-sm text-white">{booking.id}</td>
      <td className="py-3 px-2 text-body-sm text-white">{booking.customer}</td>
      <td className="py-3 px-2 text-body-sm text-[#A1A1AA]">{booking.experience}</td>
      <td className="py-3 px-2 text-body-sm text-[#A1A1AA]">{booking.date}</td>
      <td className="py-3 px-2 text-body-sm text-[#A1A1AA]">{booking.guests}</td>
      <td className="py-3 px-2 text-body-sm text-white font-medium">MK {booking.total.toLocaleString()}</td>
      <td className="py-3 px-2"><StatusBadge status={booking.status} /></td>
    </tr>
  );
}

function MiniBar({ data, height = 40 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-[#FF2D7A] to-[#FF7A18] transition-all duration-300"
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

function CalendarWidget() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const blockedDates = new Set([5, 12, 19, 25]);

  const prev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-[#0A101B] rounded-xl border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-[#A1A1AA]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-body-sm font-semibold text-white">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} {year}
        </span>
        <button onClick={next} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-[#A1A1AA]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-caption text-[#6B7280] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const blocked = blockedDates.has(d);
          return (
            <button
              key={d}
              className={`w-full aspect-square rounded-lg text-caption font-medium flex items-center justify-center transition-colors ${
                blocked
                  ? "bg-red-500/15 text-red-400 line-through"
                  : "text-[#A1A1AA] hover:bg-white/10 hover:text-white"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/15 border border-red-500/30" />
          <span className="text-caption text-[#6B7280]">Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#111827] border border-white/[0.06]" />
          <span className="text-caption text-[#6B7280]">Available</span>
        </div>
      </div>
    </div>
  );
}

function ExperienceForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-[#0A101B] border border-white/[0.06] p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-md font-bold text-white">Add Experience</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-[#A1A1AA]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          {[
            { label: "Title", placeholder: "e.g. Pool & Lunch" },
            { label: "Subtitle", placeholder: "e.g. Sun, Swim & Sip" },
            { label: "Description", placeholder: "Describe the experience...", type: "textarea" },
            { label: "Price (MWK)", placeholder: "e.g. 45000", type: "number" },
            { label: "Duration", placeholder: "e.g. 4 hours" },
            { label: "Capacity", placeholder: "e.g. 10", type: "number" },
            { label: "Location", placeholder: "e.g. Lilongwe" },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-body-sm font-medium text-white mb-1.5">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea rows={3} placeholder={field.placeholder} className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-white/[0.06] text-white text-body-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2D7A] focus:ring-1 focus:ring-[#FF2D7A]/50 transition-all resize-none" />
              ) : (
                <input type={field.type || "text"} placeholder={field.placeholder} className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-white/[0.06] text-white text-body-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2D7A] focus:ring-1 focus:ring-[#FF2D7A]/50 transition-all" />
              )}
            </div>
          ))}
          <div>
            <label className="block text-body-sm font-medium text-white mb-1.5">Category</label>
            <select className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-white/[0.06] text-white text-body-sm focus:outline-none focus:border-[#FF2D7A] appearance-none cursor-pointer">
              <option>Romantic</option>
              <option>Wellness</option>
              <option>Food & Drink</option>
              <option>Luxury</option>
              <option>Adventure</option>
              <option>Entertainment</option>
              <option>Family</option>
            </select>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-white mb-1.5">Moods</label>
            <div className="flex flex-wrap gap-1.5">
              {["Romantic", "Relax", "Celebrate", "Escape", "Indulge"].map((m) => (
                <label key={m} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111827] border border-white/[0.06] cursor-pointer hover:bg-[#1a2235] transition-colors">
                  <input type="checkbox" className="accent-[#FF2D7A]" />
                  <span className="text-caption text-[#A1A1AA]">{m}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all">
            Save Experience
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-[#111827] text-[#A1A1AA] text-body-sm font-medium hover:bg-[#1a2235] transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PartnerDashboard() {
  const [section, setSection] = useState<DashSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [partnerType, setPartnerType] = useState("All Types");

  const partnerExperiences = useMemo(
    () => experiences.filter((e) => e.location === "Lilongwe" || e.location === "Salima"),
    []
  );

  const totalRevenue = 5200000;
  const activeBookings = mockBookings.filter((b) => b.status === "confirmed").length;
  const totalExperiences = partnerExperiences.length;
  const avgRating = partnerExperiences.reduce((s, e) => s + e.rating, 0) / totalExperiences;
  const conversionRate = 68.4;
  const totalViews = 18420;
  const totalCustomers = 847;

  const popularExperiences = useMemo(() => {
    const bookingCounts: Record<string, number> = {};
    mockBookings.forEach((b) => { bookingCounts[b.experience] = (bookingCounts[b.experience] || 0) + 1; });
    return [...partnerExperiences]
      .sort((a, b) => (bookingCounts[b.title] || 0) - (bookingCounts[a.title] || 0))
      .slice(0, 5);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070B] flex">
      {/* ─── Sidebar ─── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0A101B] border-r border-white/[0.06] transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center shadow-[0_4px_12px_rgba(255,45,122,0.3)]">
              <span className="text-white font-bold text-body">M</span>
            </div>
            <div>
              <p className="text-body-sm font-bold text-white">Momento</p>
              <p className="text-caption text-[#6B7280]">Partner Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-0.5">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); setSidebarOpen(false); }}
              className={`w-full px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all ${
                section === item.key
                  ? "bg-gradient-to-r from-[#FF2D7A]/15 to-[#FF7A18]/15 text-white border border-[#FF2D7A]/20"
                  : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center text-white text-body-sm font-bold">
              LC
            </div>
            <div>
              <p className="text-body-sm font-medium text-white">Lilongwe Co.</p>
              <p className="text-caption text-[#6B7280]">Premium Partner</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-20 bg-[#05070B]/80 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-[#A1A1AA] font-bold text-heading">
                ≡
              </button>
              <h1 className="text-heading-md font-bold text-white hidden sm:block">
                {nav.find((n) => n.key === section)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={partnerType}
                onChange={(e) => setPartnerType(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#111827] text-[#A1A1AA] text-caption border border-white/[0.06] focus:outline-none focus:border-[#FF2D7A]/50 appearance-none cursor-pointer"
              >
                <option>All Types</option>
                {partnerTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center text-white text-body-sm font-bold cursor-pointer">
                  LC
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#05070B]" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {/* ─── OVERVIEW ─── */}
          {section === "overview" && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                <KpiCard label="Total Revenue (30d)" value={`MK ${totalRevenue.toLocaleString()}`} trend="12.5%" icon="💰" />
                <KpiCard label="Bookings (30d)" value={activeBookings.toString()} trend="8.2%" icon="📅" />
                <KpiCard label="Conversion Rate" value={`${conversionRate}%`} trend="3.1%" icon="🎯" />
                <KpiCard label="Total Views (30d)" value={totalViews.toLocaleString()} trend="18.7%" icon="👁" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                  <h3 className="text-body-sm font-semibold text-white mb-4">Weekly Revenue</h3>
                  <MiniBar data={weeklyRevenue} height={120} />
                  <div className="flex justify-between mt-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <span key={d} className="text-caption text-[#6B7280]">{d}</span>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                  <h3 className="text-body-sm font-semibold text-white mb-4">Popular Experiences</h3>
                  <div className="space-y-3">
                    {popularExperiences.map((exp, i) => {
                      const bookingCount = mockBookings.filter((b) => b.experience === exp.title).length;
                      return (
                        <div key={exp.id} className="flex items-center gap-3">
                          <span className="text-caption font-bold text-[#6B7280] w-4">{i + 1}</span>
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#111827]">
                            <Image src={exp.image} alt={exp.title} fill className="object-cover" sizes="36px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm font-medium text-white truncate">{exp.title}</p>
                            <p className="text-caption text-[#6B7280]">{bookingCount} booking{bookingCount !== 1 ? "s" : ""}</p>
                          </div>
                          <span className="text-caption font-medium text-emerald-400">MK {exp.price.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                <h3 className="text-body-sm font-semibold text-white mb-4">Recent Bookings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {["ID", "Customer", "Experience", "Date", "Guests", "Total", "Status"].map((h) => (
                          <th key={h} className="py-2 px-2 text-left text-caption text-[#6B7280] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockBookings.slice(0, 5).map((b) => (
                        <BookingRow key={b.id} booking={b} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── EXPERIENCES ─── */}
          {section === "experiences" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-body-sm text-[#A1A1AA]">{partnerExperiences.length} experiences</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white text-body-sm font-medium hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Experience
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {partnerExperiences.map((exp) => {
                  const expBookings = mockBookings.filter((b) => b.experience === exp.title);
                  const revenue = expBookings.reduce((s, b) => s + b.total, 0);
                  return (
                    <div key={exp.id} className="flex gap-4 p-4 rounded-xl bg-[#0A101B] border border-white/[0.06] group hover:border-white/[0.12] transition-all">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={exp.image} alt={exp.title} fill className="object-cover" sizes="96px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-body-sm font-semibold text-white truncate">{exp.title}</h3>
                            <p className="text-caption text-[#6B7280] mt-0.5">{exp.category} · {exp.location}</p>
                          </div>
                          <span className="text-caption font-medium text-white whitespace-nowrap">MK {exp.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-caption text-[#6B7280]">
                          <span>⭐ {exp.rating}</span>
                          <span>📅 {expBookings.length} bookings</span>
                          <span>💰 MK {revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="px-3 py-1 rounded-lg bg-[#111827] text-[#A1A1AA] text-caption hover:bg-[#1a2235] transition-colors">Edit</button>
                          <button className="px-3 py-1 rounded-lg bg-[#111827] text-[#A1A1AA] text-caption hover:bg-[#1a2235] transition-colors">Performance</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showForm && <ExperienceForm onClose={() => setShowForm(false)} />}
            </div>
          )}

          {/* ─── AVAILABILITY ─── */}
          {section === "availability" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-body-sm text-[#A1A1AA]">Toggle dates to block availability</p>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white text-body-sm font-medium hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all">
                  Save Changes
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map((offset) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + offset);
                  return (
                    <div key={offset}>
                      <p className="text-body-sm font-semibold text-white mb-3 text-center">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]} {d.getFullYear()}
                      </p>
                      <CalendarWidget />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── BOOKINGS ─── */}
          {section === "bookings" && (
            <div>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {(["all", "confirmed", "pending", "completed", "cancelled"] as const).map((f) => (
                  <button
                    key={f}
                    className={`px-3 py-1.5 rounded-full text-caption font-medium capitalize transition-all ${
                      f === "all" ? "bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white" : "bg-[#111827] text-[#A1A1AA] border border-white/[0.06] hover:bg-[#1a2235]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl bg-[#0A101B] border border-white/[0.06]">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {["ID", "Customer", "Experience", "Date", "Guests", "Total", "Status"].map((h) => (
                        <th key={h} className="py-3 px-3 text-left text-caption text-[#6B7280] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockBookings.map((b) => (
                      <BookingRow key={b.id} booking={b} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── CUSTOMER INSIGHTS ─── */}
          {section === "customers" && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Customers", value: totalCustomers.toLocaleString(), trend: "62 this month", icon: "👥" },
                  { label: "Repeat Rate", value: "34%", trend: "+5% vs last month", icon: "🔄" },
                  { label: "Avg Booking Value", value: "MK 138,000", trend: "+8.2%", icon: "📊" },
                  { label: "Top Category", value: "Dining", trend: "42% of bookings", icon: "🏆" },
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-caption font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">+{s.trend}</span>
                    </div>
                    <p className="text-heading-sm font-bold text-white mb-0.5">{s.value}</p>
                    <p className="text-caption text-[#6B7280]">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                  <h3 className="text-body-sm font-semibold text-white mb-4">Customer Growth</h3>
                  <MiniBar data={[45, 62, 58, 78, 91, 110, 95, 120, 145, 132, 158, 172]} height={120} />
                  <div className="flex justify-between mt-2">
                    {MONTHS_SHORT.map((m) => (
                      <span key={m} className="text-caption text-[#6B7280]">{m}</span>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                  <h3 className="text-body-sm font-semibold text-white mb-4">Customer Segments</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Couples", pct: 42, desc: "Romantic dinners, spa days" },
                      { label: "Groups", pct: 28, desc: "Brunch, day out, events" },
                      { label: "Solo", pct: 18, desc: "Wellness, treat yourself" },
                      { label: "Families", pct: 12, desc: "Staycations, adventures" },
                    ].map((seg) => (
                      <div key={seg.label}>
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-body-sm font-medium text-white">{seg.label}</span>
                            <span className="text-caption text-[#6B7280] ml-2">{seg.desc}</span>
                          </div>
                          <span className="text-caption font-medium text-white">{seg.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#111827] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18]" style={{ width: `${seg.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                <h3 className="text-body-sm font-semibold text-white mb-4">Top Customers</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {["Customer", "Bookings", "Total Spent", "Last Booking", "Status"].map((h) => (
                          <th key={h} className="py-2 px-3 text-left text-caption text-[#6B7280] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Chimwemwe Banda", bookings: 4, spent: 520000, last: "Jun 28, 2026" },
                        { name: "Zione Mwale", bookings: 3, spent: 390000, last: "Jul 2, 2026" },
                        { name: "Grace Nyirenda", bookings: 3, spent: 610000, last: "Jul 10, 2026" },
                        { name: "Temwa Phiri", bookings: 2, spent: 215000, last: "Jun 25, 2026" },
                        { name: "Peter Banda", bookings: 2, spent: 320000, last: "Jun 30, 2026" },
                      ].map((c, i) => (
                        <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 text-body-sm text-white">{c.name}</td>
                          <td className="py-3 px-3 text-body-sm text-[#A1A1AA]">{c.bookings}</td>
                          <td className="py-3 px-3 text-body-sm text-white font-medium">MK {c.spent.toLocaleString()}</td>
                          <td className="py-3 px-3 text-body-sm text-[#A1A1AA]">{c.last}</td>
                          <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full text-caption font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">VIP</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── PAYOUTS ─── */}
          {section === "payouts" && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Earned", value: "MK 5,200,000" },
                  { label: "This Month", value: "MK 1,295,000" },
                  { label: "Pending", value: "MK 450,000" },
                  { label: "Next Payout", value: "Jul 5, 2026" },
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                    <p className="text-caption text-[#6B7280] mb-1">{s.label}</p>
                    <p className="text-heading-sm font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl bg-[#0A101B] border border-white/[0.06] mb-6">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {["ID", "Period", "Amount", "Status", "Paid Date"].map((h) => (
                        <th key={h} className="py-3 px-4 text-left text-caption text-[#6B7280] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockPayouts.map((p) => (
                      <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-body-sm text-white">{p.id}</td>
                        <td className="py-3 px-4 text-body-sm text-[#A1A1AA]">{p.period}</td>
                        <td className="py-3 px-4 text-body-sm text-white font-medium">MK {p.amount.toLocaleString()}</td>
                        <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                        <td className="py-3 px-4 text-body-sm text-[#A1A1AA]">{p.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                <h3 className="text-body-sm font-semibold text-white mb-3">Payout Info</h3>
                <p className="text-caption text-[#6B7280] mb-4">
                  Payouts are processed bi-monthly on the 5th and 20th. Minimum payout threshold is MK 50,000.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Bank Account", value: "First Capital Bank · 1234******8901" },
                    { label: "Account Holder", value: "Lilongwe Co. Ltd" },
                    { label: "Tax ID", value: "MW-123456-789" },
                  ].map((info) => (
                    <div key={info.label} className="p-3 rounded-lg bg-[#111827]">
                      <p className="text-caption text-[#6B7280] mb-0.5">{info.label}</p>
                      <p className="text-body-sm text-white">{info.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 text-caption text-emerald-400 bg-emerald-400/5 px-3 py-2 rounded-lg w-fit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  All required documents verified
                </div>
              </div>
            </div>
          )}

          {/* ─── REPORTS ─── */}
          {section === "reports" && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Revenue Report", desc: "Monthly revenue breakdown with trends and forecasts", icon: "💰", color: "from-[#FF2D7A] to-[#FF7A18]" },
                  { label: "Bookings Report", desc: "Booking volumes, status distribution, and peak periods", icon: "📅", color: "from-purple-500 to-pink-500" },
                  { label: "Customer Report", desc: "Customer acquisition, retention, and lifetime value", icon: "👥", color: "from-cyan-500 to-blue-500" },
                  { label: "Performance Report", desc: "Experience ratings, reviews, and popularity scores", icon: "⭐", color: "from-amber-500 to-orange-500" },
                ].map((report) => (
                  <div key={report.label} className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06] hover:border-white/[0.12] transition-all group">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${report.color} flex items-center justify-center mb-3`}>
                      <span className="text-lg">{report.icon.split(" ")[0]}</span>
                    </div>
                    <h3 className="text-body-sm font-semibold text-white mb-1">{report.label}</h3>
                    <p className="text-caption text-[#6B7280] mb-3 leading-relaxed">{report.desc}</p>
                    <button className="text-caption font-medium text-[#FF2D7A] hover:text-[#FF7A18] transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      Download Report
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                  <h3 className="text-body-sm font-semibold text-white mb-4">Monthly Revenue Trend</h3>
                  <MiniBar data={monthlyRevenue} height={120} />
                  <div className="flex justify-between mt-2">
                    {MONTHS_SHORT.map((m) => (
                      <span key={m} className="text-caption text-[#6B7280]">{m}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                    <span className="text-caption text-[#6B7280]">Total (6 months)</span>
                    <span className="text-heading-sm font-bold text-white">MK 21,270,000</span>
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                  <h3 className="text-body-sm font-semibold text-white mb-4">Bookings Overview</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Confirmed", count: 4, pct: 40, color: "from-emerald-400 to-emerald-500" },
                      { label: "Completed", count: 3, pct: 30, color: "from-blue-400 to-blue-500" },
                      { label: "Pending", count: 2, pct: 20, color: "from-amber-400 to-amber-500" },
                      { label: "Cancelled", count: 1, pct: 10, color: "from-red-400 to-red-500" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-caption text-[#A1A1AA]">{item.label}</span>
                          <span className="text-caption text-white font-medium">{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#111827] overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 rounded-lg bg-[#111827] text-[#A1A1AA] text-caption font-medium hover:bg-[#1a2235] transition-colors flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export Full Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {section === "notifications" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-body-sm text-[#A1A1AA]">{mockNotifications.filter((n) => !n.read).length} unread</p>
                <button className="px-4 py-1.5 rounded-lg bg-[#111827] text-[#A1A1AA] text-caption font-medium hover:bg-[#1a2235] transition-colors border border-white/[0.06]">
                  Mark all as read
                </button>
              </div>

              <div className="space-y-2 mb-8">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-all ${
                      !n.read
                        ? "bg-[#0A101B] border-[#FF2D7A]/20"
                        : "bg-[#0A101B] border-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? "bg-[#FF2D7A]" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-body-sm font-medium text-white">{n.title}</h3>
                          <span className="text-caption text-[#6B7280] flex-shrink-0">{n.time}</span>
                        </div>
                        <p className="text-caption text-[#A1A1AA] mt-0.5">{n.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-xl bg-[#0A101B] border border-white/[0.06]">
                <h3 className="text-body-sm font-semibold text-white mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    { label: "New Bookings", desc: "When a customer books an experience" },
                    { label: "Cancellations", desc: "When a booking is cancelled" },
                    { label: "Reviews", desc: "When a new review is posted" },
                    { label: "Payouts", desc: "When a payout is processed" },
                    { label: "Weekly Reports", desc: "Weekly performance summary" },
                  ].map((pref) => (
                    <label key={pref.label} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-body-sm text-white">{pref.label}</p>
                        <p className="text-caption text-[#6B7280]">{pref.desc}</p>
                      </div>
                      <div className="relative w-10 h-6 rounded-full bg-[#FF2D7A] cursor-pointer transition-colors">
                        <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}