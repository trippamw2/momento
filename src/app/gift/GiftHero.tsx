"use client";

import Image from "next/image";

export default function GiftHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1512909006721-3d6018887383?w=1920&q=90"
          alt=""
          fill
          className="object-cover scale-105"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#0A0E17]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF0F73]/6 via-transparent to-[#FF7A1A]/6" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#CBD5E1] text-caption font-medium mb-6 tracking-wide uppercase">
          Premium Gifting
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#F1F5F9] mb-4 tracking-tight leading-[1.06]">
          Give More Than A Gift,
          <span className="block mt-1 bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] bg-clip-text text-transparent">
            Give A Memory.
          </span>
        </h1>

        <p className="text-[#CBD5E1] text-body-lg max-w-xl mx-auto leading-relaxed">
          Surprise someone special with an unforgettable experience.
        </p>
      </div>
    </section>
  );
}
