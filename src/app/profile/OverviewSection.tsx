"use client";

import Image from "next/image";
import type { Experience } from "@/lib/types";
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
  popularExperiences: Experience[];
  recentBookings: BookingSummary[];
}) {
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <KpiCard label="Total Revenue (30d)" value={`MK ${totalRevenue.toLocaleString()}`} trend="12.5%" icon="💰" />
        <KpiCard label="Bookings (30d)" value={activeBookings.toString()} trend="8.2%" icon="📅" />
        <KpiCard label="Conversion Rate" value={`${conversionRate}%`} trend="3.1%" icon="🎯" />
        <KpiCard label="Total Views (30d)" value={totalViews.toLocaleString()} trend="18.7%" icon="👁" />
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
