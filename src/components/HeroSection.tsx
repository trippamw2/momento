"use client";

import Image from "next/image";
import Link from "next/link";

const moods = [
  { label: "Romantic", emoji: "🌹", desc: "Perfect for two", query: "romantic" },
  { label: "Relax", emoji: "🧘", desc: "Unwind and recharge", query: "relax" },
  { label: "Celebrate", emoji: "🎉", desc: "Make it special", query: "celebrate" },
  { label: "Escape", emoji: "🌴", desc: "Get away from it all", query: "escape" },
  { label: "Treat Myself", emoji: "✨", desc: "You deserve it", query: "treat-myself" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=85"
          alt="Romantic dinner"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2D7A]/5 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto -mt-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#A1A1AA] text-caption font-medium mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#FF2D7A] animate-pulse" />
          Malawi&apos;s Premium Experience Marketplace
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight leading-[1.08]">
          How do you want to
          <span className="block mt-1 bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] bg-clip-text text-transparent">
            feel today?
          </span>
        </h1>

        <p className="text-[#A1A1AA] text-body-lg sm:text-heading-md max-w-xl mx-auto mb-10 leading-relaxed">
          Browse experiences by mood, discover something new, and make every moment count.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto">
          {moods.map((mood) => (
            <Link
              key={mood.label}
              href={`/experiences?mood=${mood.query}`}
              className="group relative inline-flex items-center gap-2.5 px-5 py-3 rounded-full text-body-sm font-medium bg-white/[0.04] border border-white/[0.08] text-white/80 hover:bg-gradient-to-r hover:from-[#FF2D7A] hover:to-[#FF7A18] hover:text-white hover:border-transparent hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300"
            >
              <span className="text-lg">{mood.emoji}</span>
              <span>{mood.label}</span>
              <span className="hidden sm:block text-white/40 text-caption group-hover:text-white/60">· {mood.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#05070B] to-transparent" />
    </section>
  );
}