"use client";

import { useState, useEffect } from "react";
import MiniBar from "./MiniBar";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

interface TopCustomer {
  name: string;
  bookings: number;
  spent: number;
  lastBooking: string;
}

interface SegmentData {
  label: string;
  pct: number;
  desc: string;
}

export default function CustomerInsightsSection({ totalCustomers }: { totalCustomers: number }) {
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [growthData, setGrowthData] = useState<number[]>([]);
  const [repeatRate, setRepeatRate] = useState(0);
  const [avgBookingValue, setAvgBookingValue] = useState(0);
  const [topCategory, setTopCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem("experio-auth-token");
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const fetchData = async () => {
      try {
        // Fetch booking analytics for customer insights
        const bRes = await fetch("/api/analytics/bookings?days=180", { headers });
        if (bRes.ok) {
          const data = await bRes.json();
          // Compute repeat rate from booking status distribution
          if (data.byStatus && Array.isArray(data.byStatus)) {
            const completed = data.byStatus.find((s: { status: string }) => s.status === "completed")?.count || 0;
            const total = data.total || 0;
            setRepeatRate(total > 0 ? Math.round((completed / total) * 100) : 0);
          }

          // Compute average booking value
          if (data.totalRevenue && data.total) {
            setAvgBookingValue(data.total > 0 ? Math.round(data.totalRevenue / data.total) : 0);
          }

          // Build customer growth data from daily counts
          if (data.daily && Array.isArray(data.daily)) {
            // Group by month
            const monthlyMap = new Map<string, number>();
            data.daily.forEach((d: { date: string; count: number }) => {
              const month = d.date.slice(0, 7);
              monthlyMap.set(month, (monthlyMap.get(month) || 0) + d.count);
            });
            const sorted = Array.from(monthlyMap.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(-6)
              .map(([, count]) => count);
            setGrowthData(sorted.length > 0 ? sorted : []);
          }
        }
      } catch { /* empty */ }

      try {
        // Fetch bookings to compute top customers and categories
        const bookingsRes = await fetch("/api/bookings/partner?limit=100", { headers });
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          const list = data.bookings || [];

          if (Array.isArray(list) && list.length > 0) {
            // Build customer stats
            const customerMap = new Map<string, { bookings: number; spent: number; lastDate: string; name: string }>();
            const categoryCount = new Map<string, number>();

            list.forEach((b: Record<string, unknown>) => {
              const customerName = ((b.user as Record<string, unknown>)?.full_name as string) || "Guest";
              const existing = customerMap.get(customerName) || { bookings: 0, spent: 0, lastDate: "", name: customerName };
              existing.bookings += 1;
              existing.spent += (b.total_price as number) || 0;
              const date = (b.experience_date as string) || (b.created_at as string) || "";
              if (date > existing.lastDate) existing.lastDate = date;
              customerMap.set(customerName, existing);

              const expTitle = ((b.experience as Record<string, unknown>)?.title as string) || "";
              const exp = expTitle;
              categoryCount.set(exp, (categoryCount.get(exp) || 0) + 1);
            });

            // Top customers
            const sortedCustomers = Array.from(customerMap.values())
              .sort((a, b) => b.spent - a.spent)
              .slice(0, 5)
              .map((c) => ({
                name: c.name,
                bookings: c.bookings,
                spent: c.spent,
                lastBooking: c.lastDate?.slice(0, 10) || "—",
              }));
            setTopCustomers(sortedCustomers);

            // Top category (experience with most bookings)
            let maxCount = 0;
            let topExp = "";
            categoryCount.forEach((count, exp) => {
              if (count > maxCount) { maxCount = count; topExp = exp; }
            });
            setTopCategory(topExp || "");

            // Customer segments (rough estimate from booking data)
            const segmentsList: SegmentData[] = [];
            const totalBookings = list.length;
            const coupleCount = list.filter((b: Record<string, unknown>) => (b.guests_count as number) === 2).length;
            const soloCount = list.filter((b: Record<string, unknown>) => (b.guests_count as number) === 1).length;
            const groupCount = list.filter((b: Record<string, unknown>) => (b.guests_count as number) >= 4).length;
            const familyCount = list.filter((b: Record<string, unknown>) => (b.guests_count as number) === 3).length;

            if (totalBookings > 0) {
              segmentsList.push(
                { label: "Couples", pct: Math.round((coupleCount / totalBookings) * 100), desc: "Intimate experiences" },
                { label: "Groups", pct: Math.round((groupCount / totalBookings) * 100), desc: "Social gatherings" },
                { label: "Solo", pct: Math.round((soloCount / totalBookings) * 100), desc: "Treat yourself" },
                { label: "Families", pct: Math.round((familyCount / totalBookings) * 100), desc: "Quality time" },
              );
            }
            setSegments(segmentsList);
          }
        }
      } catch { /* empty */ }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Customers", value: totalCustomers.toLocaleString(), trend: "From booking data", icon: <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
          { label: "Repeat Rate", value: `${repeatRate}%`, trend: "Completed bookings", icon: <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg> },
          { label: "Avg Booking Value", value: avgBookingValue > 0 ? `MK ${avgBookingValue.toLocaleString()}` : "—", trend: "From bookings", icon: <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> },
          { label: "Top Experience", value: topCategory || "—", trend: "Most booked", icon: <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg> },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl flex items-center">{s.icon}</span>
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
          {growthData.length > 0 ? (
            <>
              <MiniBar data={growthData} height={120} />
              <div className="flex justify-between mt-2">
                {MONTHS_SHORT.slice(0, growthData.length).map((m, i) => (
                  <span key={i} className="text-caption text-[#929292]">{m}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[120px] text-caption text-[#929292]">
              {loading ? "Loading..." : "No customer data available yet"}
            </div>
          )}
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
          <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Customer Segments</h3>
          {segments.length > 0 ? (
            <div className="space-y-4">
              {segments.map((seg) => (
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
          ) : (
            <div className="flex items-center justify-center h-[120px] text-caption text-[#929292]">
              {loading ? "Loading..." : "No segment data available yet"}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
        <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Top Customers</h3>
        {topCustomers.length > 0 ? (
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
                {topCustomers.map((c, i) => (
                  <tr key={i} className="border-b border-[#ebebeb] hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 px-3 text-body-sm text-[#222222]">{c.name}</td>
                    <td className="py-3 px-3 text-body-sm text-[#6a6a6a]">{c.bookings}</td>
                    <td className="py-3 px-3 text-body-sm text-[#222222] font-medium">MK {c.spent.toLocaleString()}</td>
                    <td className="py-3 px-3 text-body-sm text-[#6a6a6a]">{c.lastBooking}</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full text-caption font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">VIP</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[120px] text-caption text-[#929292]">
            {loading ? "Loading..." : "No customer data available yet"}
          </div>
        )}
      </div>
    </div>
  );
}
