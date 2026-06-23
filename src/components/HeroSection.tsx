"use client";

import Image from "next/image";
import Link from "next/link";
import { moods, moodAccent } from "@/lib/data";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden moody-gradient">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1920&q=85"
          alt="Luxury lifestyle experience"
          fill
          className="object-cover opacity-40"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/70 to-[#05070B]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2D7A]/5 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto -mt-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#A1A1AA] text-caption font-medium mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#FF2D7A] animate-pulse" />
          Live The Moment
        </div>

        <h1 className="text-display-sm sm:text-display-lg md:text-display-xl font-bold text-white mb-4 tracking-tight leading-[1.08]">
          What do you feel
          <span className="block mt-1 bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] bg-clip-text text-transparent">
            like doing?
          </span>
        </h1>

        <p className="text-[#A1A1AA] text-body-lg sm:text-heading-md max-w-lg mx-auto mb-10 leading-relaxed">
          Discover experiences that match your mood.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-w-3xl mx-auto">
          {moods.slice(0, 6).map((mood) => (
            <Link
              key={mood.label}
              href={`/experiences?mood=${mood.label.toLowerCase().replace(" ", "-")}`}
              className="mood-grid-item relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] text-white group transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 group-hover:before:opacity-100"
            >
              <div className="absolute inset-0 bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${mood.accent.replace("from-", "").replace("to-", "").replace(" ", "")})` }} />
              <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                <span className="text-caption text-white/50 uppercase tracking-wider">Mood</span>
                <span className="text-body font-semibold leading-tight">{mood.label}</span>
                <span className="text-caption text-white/40 mt-1">{mood.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#05070B] to-transparent" />
    </section>
  );
}
