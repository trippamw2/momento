import Image from "next/image";
import Link from "next/link";
import { Mood } from "@/lib/types";

const moods: { label: Mood; emoji: string }[] = [
  { label: "Romantic", emoji: "🌹" },
  { label: "Relax", emoji: "🧘" },
  { label: "Celebrate", emoji: "🎉" },
  { label: "Escape", emoji: "🌴" },
  { label: "Treat Myself", emoji: "✨" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80"
          alt="Hero background"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="gradient-overlay-hero absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-hot-pink/10 to-brand-sunset-orange/10" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <p className="overline text-brand-hot-pink mb-4">
          Malawi&apos;s Premium Experience Marketplace
        </p>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-text-primary mb-3 tracking-tight leading-display">
          How do you want to
          <span className="gradient-text block mt-1">feel today?</span>
        </h1>
        <p className="text-text-secondary text-body-lg max-w-lg mx-auto mb-8">
          Browse experiences by mood, discover something new, and make every moment count.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-xl mx-auto">
          {moods.map((mood) => (
            <Link
              key={mood.label}
              href={`/experiences?mood=${mood.label.toLowerCase().replace(" ", "-")}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-body-sm font-medium bg-white/5 backdrop-blur-md border border-white/10 text-white/80 hover:bg-gradient-to-r hover:from-brand-hot-pink hover:to-brand-sunset-orange hover:text-white hover:border-transparent transition-all duration-300"
            >
              <span>{mood.emoji}</span>
              <span>{mood.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}
