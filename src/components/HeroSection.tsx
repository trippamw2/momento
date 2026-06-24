"use client";

import Image from "next/image";
import Link from "next/link";

const MOODS = [
  { label: "Romantic", description: "Perfect for two", emoji: "🌹", accent: "from-rose-500 to-pink-500", bgColor: "bg-rose-50", borderColor: "border-rose-200", textColor: "text-rose-600", shadowColor: "shadow-rose-200/50" },
  { label: "Relax", description: "Unwind and recharge", emoji: "🌊", accent: "from-emerald-500 to-teal-500", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", textColor: "text-emerald-600", shadowColor: "shadow-emerald-200/50" },
  { label: "Celebrate", description: "Make it special", emoji: "🥂", accent: "from-amber-500 to-orange-500", bgColor: "bg-amber-50", borderColor: "border-amber-200", textColor: "text-amber-600", shadowColor: "shadow-amber-200/50" },
  { label: "Escape", description: "Get away from it all", emoji: "🌴", accent: "from-cyan-500 to-sky-500", bgColor: "bg-cyan-50", borderColor: "border-cyan-200", textColor: "text-cyan-600", shadowColor: "shadow-cyan-200/50" },
  { label: "Indulge", description: "You deserve it", emoji: "✨", accent: "from-fuchsia-500 to-purple-500", bgColor: "bg-fuchsia-50", borderColor: "border-fuchsia-200", textColor: "text-fuchsia-600", shadowColor: "shadow-fuchsia-200/50" },
  { label: "Family", description: "Fun for everyone", emoji: "👨‍👩‍👧‍👦", accent: "from-indigo-500 to-blue-500", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", textColor: "text-indigo-600", shadowColor: "shadow-indigo-200/50" },
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
          className="object-cover opacity-35 sm:opacity-45 scale-105 transition-transform duration-[20s]"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#DD2A7B]/8 via-transparent to-[#8134AF]/8" />
        {/* Subtle radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#DD2A7B]/5 via-[#F58529]/5 to-[#8134AF]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto -mt-16 sm:-mt-20">
        {/* Premium badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 border border-[#ebebeb] text-[#4a4a4a] text-caption font-semibold mb-6 sm:mb-8 backdrop-blur-md shadow-sm tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DD2A7B] animate-pulse" />
          Curated Experiences Across Africa
        </div>

        {/* Hero heading */}
        <h1 className="text-display-sm sm:text-display-lg md:text-display-xl font-bold text-[#222222] mb-4 sm:mb-5 tracking-tight leading-[1.06] text-balance">
          What do you feel
          <span className="block mt-1 bg-gradient-to-r from-[#DD2A7B] via-[#F58529] to-[#8134AF] bg-clip-text text-transparent">
            like doing?
          </span>
        </h1>

        <p className="text-[#4a4a4a] text-body-lg sm:text-heading-md max-w-xl mx-auto mb-10 sm:mb-12 leading-relaxed font-medium">
          Discover unforgettable experiences curated for every mood — from romantic dinners to weekend adventures.
        </p>

        {/* Mood grid with colored emojis */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 max-w-4xl mx-auto">
          {MOODS.map((mood) => (
            <Link
              key={mood.label}
              href={`/experiences?mood=${mood.label.toLowerCase().replace(" ", "-")}`}
              className={`group relative overflow-hidden rounded-xl p-3 sm:p-4 ${mood.bgColor} border ${mood.borderColor} hover:border-[#DD2A7B]/40 text-[#222222] transition-all duration-300 hover:shadow-md ${mood.shadowColor} hover:-translate-y-1`}
            >
              <div className="relative z-10 flex flex-col items-center gap-1 text-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${mood.bgColor} border-2 ${mood.borderColor} flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                  <span className="text-lg sm:text-xl">{mood.emoji}</span>
                </div>
                <span className={`text-caption sm:text-body-sm font-bold leading-tight ${mood.textColor}`}>{mood.label}</span>
                <span className="text-[10px] sm:text-caption text-[#4a4a4a] leading-snug">{mood.description}</span>
              </div>
              {/* Hover accent */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          ))}
        </div>
      </div>

      {/* Smoother bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent" />
    </section>
  );
}
