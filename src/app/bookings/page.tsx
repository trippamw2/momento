"use client";

import { useState } from "react";
import AuthModal from "@/components/AuthModal";

const tabs = ["Upcoming", "Past", "Cancelled"];

export default function BookingsPage() {
  const [tab, setTab] = useState("Upcoming");
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="mb-8">
            <h1 className="text-display-sm font-bold text-white mb-1">Your Bookings</h1>
            <p className="text-[#A1A1AA] text-body-lg">Manage your upcoming and past experiences</p>
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.06)] w-fit mb-8">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-body-sm font-medium transition-all duration-200 ${
                  tab === t ? "bg-[#1a2235] text-white shadow-sm" : "text-[#6B7280] hover:text-[#A1A1AA]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-[#0A101B] border border-[rgba(255,255,255,0.08)] p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#111827] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h2 className="text-heading-lg font-bold text-white mb-2">No bookings yet</h2>
            <p className="text-[#A1A1AA] text-body mb-6 max-w-sm mx-auto">
              Sign in to view your upcoming bookings, manage reservations, and track your experience history.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Sign In to View Bookings
            </button>
          </div>
        </div>
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}