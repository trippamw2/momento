"use client";

import Image from "next/image";
import Link from "next/link";

const MOODS = [
  { label: "Romantic", description: "Perfect for two", accent: "from-rose-500 to-pink-500" },
  { label: "Relax", description: "Unwind and recharge", accent: "from-emerald-500 to-teal-500" },
  { label: "Celebrate", description: "Make it special", accent: "from-amber-500 to-orange-500" },
  { label: "Escape", description: "Get away from it all", accent: "from-cyan-500 to-sky-500" },
  { label: "Indulge", description: "You deserve it", accent: "from-fuchsia-500 to-purple-500" },
  { label: "Family", description: "Fun for everyone", accent: "from-indigo-500 to-blue-500" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#f7f7f7]">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1920&q=85"
          alt="Luxury lifestyle experience"
          fill
          className="object-cover opacity-60"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff385c]/5 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto -mt-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#dddddd] text-[#6a6a6a] text-caption font-medium mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#ff385c] animate-pulse" />
          Live The Moment
        </div>

        <h1 className="text-display-sm sm:text-display-lg md:text-display-xl font-bold text-[#222222] mb-4 tracking-tight leading-[1.08]">
          What do you feel
          <span className="block mt-1 bg-gradient-to-r from-[#ff385c] to-[#FF7A18] bg-clip-text text-transparent">
            like doing?
          </span>
        </h1>

        <p className="text-[#6a6a6a] text-body-lg sm:text-heading-md max-w-lg mx-auto mb-10 leading-relaxed">
          Discover experiences that match your mood.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-w-3xl mx-auto">
          {MOODS.map((mood) => (
            <Link
              key={mood.label}
              href={`/experiences?mood=${mood.label.toLowerCase().replace(" ", "-")}`}
              className="mood-grid-item relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white border border-[#dddddd] hover:border-[#ff385c] text-[#222222] group transition-all duration-300"
            >
              <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                <span className="text-caption text-[#929292] uppercase tracking-wider">Mood</span>
                <span className="text-body font-semibold leading-tight">{mood.label}</span>
                <span className="text-caption text-[#929292] mt-1">{mood.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
