"use client";

import Image from "next/image";
import Link from "next/link";

const MOODS = [
  { emoji: "❤️", label: "Romantic", description: "Perfect for two" },
  { emoji: "😌", label: "Relax", description: "Unwind and recharge" },
  { emoji: "🎉", label: "Celebrate", description: "Make it special" },
  { emoji: "🌴", label: "Escape", description: "Get away from it all" },
  { emoji: "✨", label: "Treat Myself", description: "You deserve it" },
  { emoji: "🍽", label: "Food & Drink", description: "Taste the moment" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] sm:min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1920&q=90"
          alt="Luxury lifestyle experience"
          fill
          className="object-cover opacity-25 sm:opacity-35 scale-105 transition-transform duration-[20s]"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/70 to-[#05070B]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF0F73]/10 via-transparent to-[#FF7A1A]/10" />
        {/* Subtle radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#FF0F73]/8 via-[#FF7A1A]/8 to-[#FF0F73]/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto -mt-16 sm:-mt-20">
        {/* Premium badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#111827]/90 border border-white/[0.1] text-[#CBD5E1] text-caption font-semibold mb-6 sm:mb-8 backdrop-blur-md shadow-sm tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF0F73] animate-pulse" />
          Curated Experiences Across Africa
        </div>

        {/* Hero heading */}
        <h1 className="text-display-sm sm:text-display-lg md:text-display-xl font-bold text-white mb-4 sm:mb-5 tracking-tight leading-[1.06] text-balance">
          What do you feel
          <span className="block mt-1 bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] bg-clip-text text-transparent">
            like doing?
          </span>
        </h1>

        <p className="text-[#CBD5E1] text-body-lg sm:text-heading-md max-w-xl mx-auto mb-10 sm:mb-12 leading-relaxed font-medium">
          Discover unforgettable experiences curated for every mood — from romantic dinners to weekend adventures.
        </p>

        {/* Mood grid with emojis */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 max-w-4xl mx-auto">
          {MOODS.map((mood) => (
            <Link
              key={mood.label}
              href={`/experiences?mood=${mood.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="group relative overflow-hidden rounded-xl p-3 sm:p-4 bg-[#111827] border border-white/[0.1] hover:border-[#FF0F73]/40 text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(255, 15, 115, 0.15)] hover:-translate-y-1"
            >
              <div className="relative z-10 flex flex-col items-center gap-1 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1A2332] border-2 border-white/[0.1] flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <span className="text-lg sm:text-xl">{mood.emoji}</span>
                </div>
                <span className="text-caption sm:text-body-sm font-bold leading-tight text-white">{mood.label}</span>
                <span className="text-[10px] sm:text-caption text-[#94A3B8] leading-snug">{mood.description}</span>
              </div>
              {/* Hover accent */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          ))}
        </div>
      </div>

      {/* Smoother bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#05070B] via-[#05070B]/80 to-transparent" />
    </section>
  );
}
