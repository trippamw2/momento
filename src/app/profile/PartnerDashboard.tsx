"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { experiences } from "@/lib/data";

type DashSection = "overview" | "experiences" | "bookings" | "availability" | "analytics" | "payouts";

const partnerTypes = ["Hotels", "Restaurants", "Spas", "Resorts", "Gyms"];

const nav: { key: DashSection; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "experiences", label: "Experiences", icon: "🎯" },
  { key: "bookings", label: "Bookings", icon: "📅" },
  { key: "availability", label: "Availability", icon: "🔓" },
  { key: "analytics", label: "Analytics", icon: "📈" },
  { key: "payouts", label: "Payouts", icon: "💰" },
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
];

const mockPayouts = [
  { id: "PO-001", period: "1-15 Jun 2026", amount: 845000, status: "paid" as const, date: "2026-06-18" },
  { id: "PO-002", period: "16-31 May 2026", amount: 1230000, status: "paid" as const, date: "2026-06-05" },
  { id: "PO-003", period: "1-15 May 2026", amount: 675000, status: "paid" as const, date: "2026-05-20" },
  { id: "PO-004", period: "16-30 Apr 2026", amount: 920000, status: "paid" as const, date: "2026-05-05" },
  { id: "PO-005", period: "1-15 Jun 2026", amount: 450000, status: "pending" as const, date: "2026-07-05" },
];

const weeklyRevenue = [320000, 480000, 560000, 720000, 610000, 890000, 945000];
const monthlyRevenue = [2100000, 2850000, 3200000, 4100000, 3800000, 5200000];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function KpiCard({ label, value, trend, icon }: { label: string; value: string; trend?: string; icon: string }) {
  return (
    <div className="p-5 rounded-xl bg-surface-secondary border border-border-default">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className="text-caption font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            +{trend}
          </span>
        )}
      </div>
      <p className="text-heading-lg font-bold text-text-primary mb-0.5">{value}</p>
      <p className="text-caption text-text-tertiary">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-emerald-400/10 text-emerald-400",
    pending: "bg-amber-400/10 text-amber-400",
    completed: "bg-blue-400/10 text-blue-400",
    cancelled: "bg-red-400/10 text-red-400",
    paid: "bg-emerald-400/10 text-emerald-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-caption font-medium capitalize ${colors[status] || "bg-surface-tertiary text-text-tertiary"}`}>
      {status}
    </span>
  );
}

function BookingRow({ booking }: { booking: typeof mockBookings[0] }) {
  return (
    <tr className="border-b border-border-subtle hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-2 text-body-sm text-text-primary">{booking.id}</td>
      <td className="py-3 px-2 text-body-sm text-text-primary">{booking.customer}</td>
      <td className="py-3 px-2 text-body-sm text-text-secondary">{booking.experience}</td>
      <td className="py-3 px-2 text-body-sm text-text-secondary">{booking.date}</td>
      <td className="py-3 px-2 text-body-sm text-text-secondary">{booking.guests}</td>
      <td className="py-3 px-2 text-body-sm text-text-primary font-medium">MK {booking.total.toLocaleString()}</td>
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
          className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-hot-pink to-brand-sunset-orange transition-all duration-300"
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
    <div className="bg-surface-secondary rounded-xl border border-border-default p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-text-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-body-sm font-semibold text-text-primary">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} {year}
        </span>
        <button onClick={next} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-text-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-caption text-text-tertiary py-1">{d}</div>
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
                  : "text-text-secondary hover:bg-white/10 hover:text-text-primary"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-subtle">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/15" />
          <span className="text-caption text-text-tertiary">Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-surface-tertiary" />
          <span className="text-caption text-text-tertiary">Available</span>
        </div>
      </div>
    </div>
  );
}

function ExperienceForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-surface-secondary border border-border-default p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-md font-bold text-text-primary">Add Experience</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-text-secondary">
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
              <label className="block text-body-sm font-medium text-text-primary mb-1.5">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea rows={3} placeholder={field.placeholder} className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-subtle text-text-primary text-body-sm placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand-hot-pink focus:ring-1 focus:ring-brand-hot-pink/50 transition-all resize-none" />
              ) : (
                <input type={field.type || "text"} placeholder={field.placeholder} className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-subtle text-text-primary text-body-sm placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand-hot-pink focus:ring-1 focus:ring-brand-hot-pink/50 transition-all" />
              )}
            </div>
          ))}

          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-1.5">Category</label>
            <select className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-subtle text-text-primary text-body-sm focus:outline-none focus:border-brand-hot-pink appearance-none cursor-pointer">
              <option>Dining</option>
              <option>Wellness</option>
              <option>Day Out</option>
              <option>Nightlife</option>
              <option>Adventure</option>
              <option>Overnight</option>
              <option>Events</option>
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-1.5">Moods</label>
            <div className="flex flex-wrap gap-1.5">
              {["Romantic", "Relax", "Celebrate", "Escape", "Treat Myself"].map((m) => (
                <label key={m} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-tertiary border border-border-subtle cursor-pointer hover:bg-surface-elevated transition-colors">
                  <input type="checkbox" className="accent-brand-hot-pink" />
                  <span className="text-caption text-text-secondary">{m}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-2.5 rounded-full gradient-brand text-text-on-gradient font-semibold text-body-sm hover:shadow-brand-glow transition-all">
            Save Experience
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full bg-surface-tertiary text-text-secondary text-body-sm font-medium hover:bg-surface-elevated transition-all">
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

  const stats = [
    { label: "Total Revenue (30d)", value: `MK ${totalRevenue.toLocaleString()}`, trend: "12.5%", icon: "💰" },
    { label: "Active Bookings", value: activeBookings.toString(), trend: "8.2%", icon: "📅" },
    { label: "Total Experiences", value: totalExperiences.toString(), icon: "🎯" },
    { label: "Avg Rating", value: avgRating.toFixed(1), trend: "0.3", icon: "⭐" },
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {/* ─── Sidebar ─── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface-secondary border-r border-border-default transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-5 border-b border-border-default">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-body">M</span>
            </div>
            <div>
              <p className="text-body-sm font-bold text-text-primary">Momento</p>
              <p className="text-caption text-text-tertiary">Partner Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all ${
                section === item.key
                  ? "gradient-brand text-text-on-gradient"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center text-text-secondary text-body-sm">
              LC
            </div>
            <div>
              <p className="text-body-sm font-medium text-text-primary">Lilongwe Co.</p>
              <p className="text-caption text-text-tertiary">Premium Partner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-lg border-b border-border-default">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-text-secondary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-heading-md font-bold text-text-primary hidden sm:block">
                {nav.find((n) => n.key === section)?.label}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={partnerType}
                onChange={(e) => setPartnerType(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-surface-tertiary text-text-secondary text-caption border border-border-subtle focus:outline-none focus:border-brand-hot-pink/50 appearance-none cursor-pointer"
              >
                <option>All Types</option>
                {partnerTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-body-sm font-bold cursor-pointer">
                LC
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {/* ─── Overview ─── */}
          {section === "overview" && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {stats.map((s) => (
                  <KpiCard key={s.label} {...s} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-xl bg-surface-secondary border border-border-default">
                  <h3 className="text-body-sm font-semibold text-text-primary mb-4">Weekly Revenue</h3>
                  <MiniBar data={weeklyRevenue} height={120} />
                  <div className="flex justify-between mt-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <span key={d} className="text-caption text-text-tertiary">{d}</span>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-surface-secondary border border-border-default">
                  <h3 className="text-body-sm font-semibold text-text-primary mb-4">Monthly Revenue</h3>
                  <MiniBar data={monthlyRevenue} height={120} />
                  <div className="flex justify-between mt-2">
                    {MONTHS_SHORT.map((m) => (
                      <span key={m} className="text-caption text-text-tertiary">{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface-secondary border border-border-default">
                <h3 className="text-body-sm font-semibold text-text-primary mb-4">Recent Bookings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        {["ID", "Customer", "Experience", "Date", "Guests", "Total", "Status"].map((h) => (
                          <th key={h} className="py-2 px-2 text-left text-caption text-text-tertiary font-medium">{h}</th>
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

          {/* ─── Experiences ─── */}
          {section === "experiences" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-body-sm text-text-secondary">{partnerExperiences.length} experiences</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full gradient-brand text-text-on-gradient text-body-sm font-medium hover:shadow-brand-glow transition-all"
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
                    <div key={exp.id} className="flex gap-4 p-4 rounded-xl bg-surface-secondary border border-border-default group">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={exp.image} alt={exp.title} fill className="object-cover" sizes="96px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-body-sm font-semibold text-text-primary truncate">{exp.title}</h3>
                            <p className="text-caption text-text-tertiary mt-0.5">{exp.category} · {exp.location}</p>
                          </div>
                          <span className="text-caption font-medium text-text-secondary whitespace-nowrap">MK {exp.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-caption text-text-tertiary">
                          <span>⭐ {exp.rating}</span>
                          <span>📅 {expBookings.length} bookings</span>
                          <span>💰 MK {revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="px-3 py-1 rounded-full bg-surface-tertiary text-text-secondary text-caption hover:bg-surface-elevated transition-colors">Edit</button>
                          <button className="px-3 py-1 rounded-full bg-surface-tertiary text-text-secondary text-caption hover:bg-surface-elevated transition-colors">Performance</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showForm && <ExperienceForm onClose={() => setShowForm(false)} />}
            </div>
          )}

          {/* ─── Bookings ─── */}
          {section === "bookings" && (
            <div>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {(["all", "confirmed", "pending", "completed", "cancelled"] as const).map((f) => (
                  <button
                    key={f}
                    className={`px-3 py-1.5 rounded-full text-caption font-medium capitalize transition-all ${
                      f === "all" ? "gradient-brand text-text-on-gradient" : "bg-surface-tertiary text-text-secondary border border-border-subtle hover:bg-surface-elevated"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl bg-surface-secondary border border-border-default">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      {["ID", "Customer", "Experience", "Date", "Guests", "Total", "Status"].map((h) => (
                        <th key={h} className="py-3 px-3 text-left text-caption text-text-tertiary font-medium">{h}</th>
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

          {/* ─── Availability ─── */}
          {section === "availability" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-body-sm text-text-secondary">Toggle dates to block availability</p>
                <button className="px-4 py-2 rounded-full gradient-brand text-text-on-gradient text-body-sm font-medium hover:shadow-brand-glow transition-all">
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map((offset) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + offset);
                  return (
                    <div key={offset}>
                      <p className="text-body-sm font-semibold text-text-primary mb-3 text-center">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]} {d.getFullYear()}
                      </p>
                      <CalendarWidget />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Analytics ─── */}
          {section === "analytics" && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Customers", value: "847", trend: "+62 this month", icon: "👥" },
                  { label: "Repeat Rate", value: "34%", trend: "+5% vs last month", icon: "🔄" },
                  { label: "Avg Booking Value", value: "MK 138,000", trend: "+8.2%", icon: "📊" },
                  { label: "Top Category", value: "Dining", trend: "42% of bookings", icon: "🏆" },
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-xl bg-surface-secondary border border-border-default">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{s.icon}</span>
                      <p className="text-caption text-text-tertiary">{s.label}</p>
                    </div>
                    <p className="text-heading-sm font-bold text-text-primary mb-0.5">{s.value}</p>
                    <p className="text-caption text-emerald-400">{s.trend}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-xl bg-surface-secondary border border-border-default">
                  <h3 className="text-body-sm font-semibold text-text-primary mb-4">Customer Growth</h3>
                  <MiniBar data={[45, 62, 58, 78, 91, 110, 95, 120, 145, 132, 158, 172]} height={120} />
                  <div className="flex justify-between mt-2">
                    {MONTHS_SHORT.map((m) => (
                      <span key={m} className="text-caption text-text-tertiary">{m}</span>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-surface-secondary border border-border-default">
                  <h3 className="text-body-sm font-semibold text-text-primary mb-4">Bookings by Category</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Dining", pct: 38, color: "from-brand-hot-pink to-brand-sunset-orange" },
                      { label: "Wellness", pct: 24, color: "from-purple-500 to-pink-500" },
                      { label: "Day Out", pct: 18, color: "from-cyan-500 to-blue-500" },
                      { label: "Nightlife", pct: 12, color: "from-amber-500 to-orange-500" },
                      { label: "Other", pct: 8, color: "from-gray-500 to-gray-400" },
                    ].map((cat) => (
                      <div key={cat.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-caption text-text-secondary">{cat.label}</span>
                          <span className="text-caption text-text-tertiary">{cat.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Payouts ─── */}
          {section === "payouts" && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Total Earned", value: "MK 5,200,000" },
                  { label: "Pending", value: "MK 450,000" },
                  { label: "Next Payout", value: "Jul 5, 2026" },
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-xl bg-surface-secondary border border-border-default">
                    <p className="text-caption text-text-tertiary mb-1">{s.label}</p>
                    <p className="text-heading-sm font-bold text-text-primary">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl bg-surface-secondary border border-border-default">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      {["ID", "Period", "Amount", "Status", "Paid Date"].map((h) => (
                        <th key={h} className="py-3 px-4 text-left text-caption text-text-tertiary font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockPayouts.map((p) => (
                      <tr key={p.id} className="border-b border-border-subtle hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-body-sm text-text-primary">{p.id}</td>
                        <td className="py-3 px-4 text-body-sm text-text-secondary">{p.period}</td>
                        <td className="py-3 px-4 text-body-sm text-text-primary font-medium">MK {p.amount.toLocaleString()}</td>
                        <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                        <td className="py-3 px-4 text-body-sm text-text-secondary">{p.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-5 rounded-xl bg-surface-secondary border border-border-default">
                <h3 className="text-body-sm font-semibold text-text-primary mb-3">Payout Summary</h3>
                <p className="text-caption text-text-tertiary mb-4">
                  Payouts are processed bi-monthly on the 5th and 20th. Minimum payout threshold is MK 50,000.
                </p>
                <div className="flex items-center gap-2 text-caption text-emerald-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  All required documents verified
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
