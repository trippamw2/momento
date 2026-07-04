"use client";

import MiniBar from "./MiniBar";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export default function CustomerInsightsSection({ totalCustomers }: { totalCustomers: number }) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Customers", value: totalCustomers.toLocaleString(), trend: "62 this month", icon: "👥" },
          { label: "Repeat Rate", value: "34%", trend: "+5% vs last month", icon: "🔄" },
          { label: "Avg Booking Value", value: "MK 138,000", trend: "+8.2%", icon: "📊" },
          { label: "Top Category", value: "Dining", trend: "42% of bookings", icon: "🏆" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-caption font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{s.trend}</span>
            </div>
            <p className="text-heading-sm font-bold text-[#222222] mb-0.5">{s.value}</p>
            <p className="text-caption text-[#929292]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
          <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Customer Growth</h3>
          <MiniBar data={[45, 62, 58, 78, 91, 110, 95, 120, 145, 132, 158, 172]} height={120} />
          <div className="flex justify-between mt-2">
            {MONTHS_SHORT.map((m) => (
              <span key={m} className="text-caption text-[#929292]">{m}</span>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
          <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Customer Segments</h3>
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
                    <span className="text-body-sm font-medium text-[#222222]">{seg.label}</span>
                    <span className="text-caption text-[#929292] ml-2">{seg.desc}</span>
                  </div>
                  <span className="text-caption font-medium text-[#222222]">{seg.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#ebebeb] overflow-hidden">
                  <div className="h-full rounded-full bg-[#FF0F73]" style={{ width: `${seg.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
        <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Top Customers</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-[#ebebeb]">
                {["Customer", "Bookings", "Total Spent", "Last Booking", "Status"].map((h) => (
                  <th key={h} className="py-2 px-3 text-left text-caption text-[#929292] font-medium">{h}</th>
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
                <tr key={i} className="border-b border-[#ebebeb] hover:bg-[#fafafa] transition-colors">
                  <td className="py-3 px-3 text-body-sm text-[#222222]">{c.name}</td>
                  <td className="py-3 px-3 text-body-sm text-[#6a6a6a]">{c.bookings}</td>
                  <td className="py-3 px-3 text-body-sm text-[#222222] font-medium">MK {c.spent.toLocaleString()}</td>
                  <td className="py-3 px-3 text-body-sm text-[#6a6a6a]">{c.last}</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full text-caption font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">VIP</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
