"use client";

import Link from "next/link";

export default function BookingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center bg-ambient-warm">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 rounded-full bg-[#FFF0F3] flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <h1 className="text-display-sm font-bold text-[#222222] mb-3">Couldn&apos;t load bookings</h1>
        <p className="text-[#6a6a6a] text-body mb-6">
          Something went wrong while loading your bookings. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-8 py-3 rounded-xl bg-white text-[#222222] font-semibold text-body-sm border border-[#ebebeb] hover:bg-[#FFF8F0] transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
