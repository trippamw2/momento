"use client";

import Image from "next/image";
import KpiCard from "./KpiCard";
import MiniBar from "./MiniBar";
import BookingRow from "./BookingRow";

interface BookingSummary {
  id: string;
  customer: string;
  experience: string;
  date: string;
  guests: number;
  total: number;
  status: string;
}

interface PopularExperience {
  id: string;
  title: string;
  image: string;
  price: number;
}

export default function OverviewSection({
  totalRevenue,
  activeBookings,
  conversionRate,
  totalViews,
  weeklyRevenue,
  popularExperiences,
  recentBookings,
}: {
  totalRevenue: number;
  activeBookings: number;
  conversionRate: number;
  totalViews: number;
  weeklyRevenue: number[];
  popularExperiences: PopularExperience[];
  recentBookings: BookingSummary[];
}) {
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <KpiCard label="Total Revenue (30d)" value={`MK ${totalRevenue.toLocaleString()}`} trend="12.5%" icon={
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <KpiCard label="Bookings (30d)" value={activeBookings.toString()} trend="8.2%" icon={
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M3 10h18" />
            <path d="M8 2v4" />
            <path d="M16 2v4" />
          </svg>
        } />
        <KpiCard label="Conversion Rate" value={`${conversionRate}%`} trend="3.1%" icon={
          <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        } />
        <KpiCard label="Total Views (30d)" value={totalViews.toLocaleString()} trend="18.7%" icon={
          <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        } />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
          <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Weekly Revenue</h3>
          <MiniBar data={weeklyRevenue} height={120} />
          <div className="flex justify-between mt-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="text-caption text-[#929292]">{d}</span>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
          <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Popular Experiences</h3>
          <div className="space-y-3">
            {popularExperiences.map((exp, i) => {
              const bookingCount = recentBookings.filter((b) => b.experience === exp.title).length;
              return (
                <div key={exp.id} className="flex items-center gap-3">
                  <span className="text-caption font-bold text-[#929292] w-4">{i + 1}</span>
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#f7f7f7]">
                    <Image src={exp.image} alt={exp.title} fill className="object-cover" sizes="36px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-[#222222] truncate">{exp.title}</p>
                    <p className="text-caption text-[#929292]">{bookingCount} booking{bookingCount !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-caption font-medium text-emerald-600">MK {exp.price.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
        <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[#ebebeb]">
                {["ID", "Customer", "Experience", "Date", "Guests", "Total", "Status"].map((h) => (
                  <th key={h} className="py-2 px-2 text-left text-caption text-[#929292] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.slice(0, 5).map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
