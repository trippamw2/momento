"use client";

import Image from "next/image";
import Link from "next/link";

const MOODS = [
  { label: "Romantic", description: "Perfect for two", emoji: "🌹", accent: "from-rose-500 to-pink-500" },
  { label: "Relax", description: "Unwind and recharge", emoji: "🌊", accent: "from-emerald-500 to-teal-500" },
  { label: "Celebrate", description: "Make it special", emoji: "🥂", accent: "from-amber-500 to-orange-500" },
  { label: "Escape", description: "Get away from it all", emoji: "🌴", accent: "from-cyan-500 to-sky-500" },
  { label: "Indulge", description: "You deserve it", emoji: "✨", accent: "from-fuchsia-500 to-purple-500" },
  { label: "Family", description: "Fun for everyone", emoji: "👨‍👩‍👧‍👦", accent: "from-indigo-500 to-blue-500" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden bg-ambient-warm">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1920&q=85"
          alt="Luxury lifestyle experience"
          fill
          className="object-cover opacity-40 sm:opacity-50"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFF8F0] via-[#FFF8F0]/80 to-white/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff385c]/5 via-transparent to-[#9F3BFF]/5" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto -mt-12 sm:-mt-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#ebebeb] text-[#6a6a6a] text-caption font-medium mb-5 sm:mb-6 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#ff385c] animate-pulse" />
          Live The Moment
        </div>

        <h1 className="text-display-sm sm:text-display-lg md:text-display-xl font-bold text-[#222222] mb-3 sm:mb-4 tracking-tight leading-[1.08] text-balance">
          What do you feel
          <span className="block mt-1 bg-gradient-to-r from-[#ff385c] to-[#FF7A18] bg-clip-text text-transparent">
            like doing?
          </span>
        </h1>

        <p className="text-[#6a6a6a] text-body-lg sm:text-heading-md max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed">
          Discover experiences that match your mood.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 max-w-3xl mx-auto">
          {MOODS.map((mood) => (
            <Link
              key={mood.label}
              href={`/experiences?mood=${mood.label.toLowerCase().replace(" ", "-")}`}
              className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-white/80 backdrop-blur-sm border border-[#ebebeb] hover:border-[#ff385c]/40 text-[#222222] transition-all duration-300 hover:shadow-lg hover:shadow-[#ff385c]/5 hover:-translate-y-1"
            >
              <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                <span className="text-2xl sm:text-3xl mb-1">{mood.emoji}</span>
                <span className="text-body-sm sm:text-body font-semibold leading-tight">{mood.label}</span>
                <span className="text-caption text-[#929292]">{mood.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/60 to-transparent" />
    </section>
  );
}
