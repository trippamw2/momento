"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const moods = [
  { label: "Romantic", emoji: "❤️" },
  { label: "Relax", emoji: "😌" },
  { label: "Celebrate", emoji: "🎉" },
  { label: "Escape", emoji: "🌴" },
  { label: "Treat Myself", emoji: "✨" },
];

export default function HeroSection() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/experiences?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=85"
          alt="Luxury poolside experience"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/50 to-[#05070B]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2D7A]/10 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto -mt-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#A1A1AA] text-caption font-medium mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#FF2D7A] animate-pulse" />
          Africa&apos;s Premium Experience Marketplace
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight leading-[1.08]">
          How do you want to
          <span className="block mt-1 bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] bg-clip-text text-transparent">
            feel today?
          </span>
        </h1>

        <p className="text-[#A1A1AA] text-body-lg sm:text-heading-md max-w-lg mx-auto mb-8 leading-relaxed">
          Discover experiences tailored to your mood.
        </p>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search experiences, locations, categories..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-[#0A101B]/80 backdrop-blur-xl border border-white/[0.08] text-white text-body placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2D7A]/50 focus:ring-1 focus:ring-[#FF2D7A]/30 transition-all shadow-lg shadow-black/20"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {moods.map((mood) => (
            <Link
              key={mood.label}
              href={`/experiences?mood=${mood.label.toLowerCase().replace(" ", "-")}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-body-sm font-medium bg-white/[0.04] border border-white/[0.08] text-white/80 hover:bg-gradient-to-r hover:from-[#FF2D7A] hover:to-[#FF7A18] hover:text-white hover:border-transparent hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300"
            >
              <span>{mood.emoji}</span>
              <span>{mood.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#05070B] to-transparent" />
    </section>
  );
}