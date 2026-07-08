"use client";

import Image from "next/image";

export default function GiftHero() {
  return (
    <section className="relative min-h-[60vh] sm:min-h-[65vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1512909006721-3d6018887383?w=1920&q=90"
          alt="Luxury gift box with experiences"
          fill
          className="object-cover scale-105"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#0A0E17]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF0F73]/8 via-transparent to-[#FF7A1A]/8" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#FF0F73]/8 to-[#FF7A1A]/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto -mt-8">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#111827]/90 border border-white/[0.08] text-[#CBD5E1] text-caption font-semibold mb-6 backdrop-blur-md shadow-sm tracking-wide uppercase">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
          Premium Gifting
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#F1F5F9] mb-4 tracking-tight leading-[1.06]">
          Give More Than A Gift,
          <span className="block mt-1 bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] bg-clip-text text-transparent">
            Give A Memory.
          </span>
        </h1>

        <p className="text-[#CBD5E1] text-body-lg sm:text-heading-md max-w-xl mx-auto mb-10 leading-relaxed font-medium">
          Surprise someone special with an unforgettable experience — delivered instantly to their phone.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { svg: <svg key="zap" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, label: "Instant Delivery" },
            { svg: <svg key="cal" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, label: "Valid For 12 Months" },
            { svg: <svg key="check" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: "Easy Redemption" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#111827]/90 border border-white/[0.08] backdrop-blur-md shadow-sm"
            >
              {badge.svg}
              <span className="text-[#CBD5E1] text-body-sm font-semibold">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#05070B] via-[#05070B]/80 to-transparent" />
    </section>
  );
}
