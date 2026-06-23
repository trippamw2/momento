"use client";

import { useEffect, useState, useMemo } from "react";
import HeroSection from "@/components/HeroSection";
import ContentRail from "@/components/ContentRail";
import Link from "next/link";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { Experience } from "@/lib/types";
import { experiences as mockExperiences } from "@/lib/data";

const RAILS: { key: string; title: string; filter: (e: Experience) => boolean }[] = [
  { key: "trending", title: "Trending Right Now", filter: (e) => e.rating >= 4.7 },
  { key: "recommended", title: "Recommended For You", filter: (e) => e.mood.some((m) => ["Relax", "Indulge", "Self Care"].includes(m as any)) },
  { key: "weekend", title: "Perfect For This Weekend", filter: (e) => parseInt(e.duration) > 0 && parseInt(e.duration) <= 4 },
  { key: "most-saved", title: "Most Saved", filter: () => true },
  { key: "date-ideas", title: "Date Night Ideas", filter: (e) => e.mood.includes("Romantic" as any) },
  { key: "wellness", title: "Wellness & Self Care", filter: (e) => e.mood.some((m) => ["Self Care", "Relax"].includes(m as any)) },
  { key: "food-drink", title: "Food & Drink", filter: (e) => e.mood.includes("Food & Drink" as any) },
  { key: "luxury", title: "Luxury Experiences", filter: (e) => e.price >= 100000 },
  { key: "celebrations", title: "Celebrations", filter: (e) => e.mood.includes("Celebrate" as any) },
  { key: "hidden-gems", title: "Hidden Gems", filter: (e) => e.rating >= 4.5 && e.reviewCount < 60 },
  { key: "staff-picks", title: "Staff Picks", filter: (e) => e.rating >= 4.8 },
  { key: "affordable", title: "Affordable Experiences", filter: (e) => e.price <= 50000 },
  { key: "adventure", title: "Adventure Awaits", filter: (e) => e.mood.includes("Adventure" as any) },
  { key: "family", title: "Family Fun", filter: (e) => e.mood.includes("Family" as any) },
];

const RAIL_ORDER = [
  "trending", "recommended", "weekend", "most-saved", "date-ideas",
  "wellness", "food-drink", "luxury", "celebrations", "hidden-gems",
  "staff-picks", "affordable", "adventure", "family",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Home() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExperiences({ limit: 50 })
      .then((res) => {
        const mapped = (res.experiences as Record<string, unknown>[]).map(transformExperience);
        setExperiences(mapped.length > 0 ? mapped : mockExperiences);
      })
      .catch(() => {
        setExperiences(mockExperiences);
      })
      .finally(() => setLoading(false));
  }, []);

  const rails = useMemo(() => {
    if (experiences.length === 0) return [];
    return RAIL_ORDER
      .map((key) => {
        const cfg = RAILS.find((r) => r.key === key);
        if (!cfg) return null;
        let filtered = experiences.filter(cfg.filter);
        if (key === "most-saved") filtered = [...filtered].sort((a, b) => b.reviewCount - a.reviewCount);
        return { key, title: cfg.title, experiences: shuffle(filtered).slice(0, 8) };
      })
      .filter((r) => r && r.experiences.length > 0) as { key: string; title: string; experiences: Experience[] }[];
  }, [experiences]);

  const giftIdeas = useMemo(() => {
    if (experiences.length === 0) return [];
    const all = [
      ...experiences.filter((e) => e.mood.includes("Indulge" as any)),
      ...experiences.filter((e) => e.mood.includes("Romantic" as any)),
    ];
    return shuffle(all).slice(0, 4);
  }, [experiences]);

  return (
    <div className="overflow-x-hidden">
      <HeroSection />

      <div className="relative z-10 -mt-12 sm:-mt-16 pb-16 space-y-1">
        {rails.map((rail) => (
          <ContentRail
            key={rail.key}
            title={rail.title}
            experiences={rail.experiences}
            viewAllHref="/experiences"
          />
        ))}

        {/* ─── Social Proof Bar ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 my-6 sm:my-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 py-4 sm:py-5 px-4 sm:px-8 rounded-2xl bg-[#FFF8F0] border border-[#ebebeb]">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["/avatar1.jpg", "/avatar2.jpg", "/avatar3.jpg"].map((src, i) => (
                  <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#ff385c] to-[#FF7A18] flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">
                    {["A", "M", "K"][i]}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-caption text-[#4a4a4a] font-medium">Trusted by 10,000+ explorers</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-caption text-[#4a4a4a]">
              <span className="flex items-center gap-1">✓ Curated experiences</span>
              <span className="hidden xs:inline flex items-center gap-1">✓ Instant booking</span>
              <span className="flex items-center gap-1">✓ Free cancellation</span>
            </div>
          </div>
        </section>

        {/* ─── Gift A Moment ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 my-10">
          <div className="relative rounded-2xl overflow-hidden border border-[#dddddd] bg-[#fafafa]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff385c]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#9F3BFF]/5 rounded-full blur-3xl" />
            <div className="relative z-10 p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#dddddd] text-caption text-[#4a4a4a] mb-4">
                    Gift A Moment
                  </div>
                  <h2 className="text-heading-xl sm:text-display-sm font-bold text-[#222222] mb-3 leading-tight">
                    Give More Than A Gift.
                    <span className="block bg-gradient-to-r from-[#ff385c] to-[#FF7A18] bg-clip-text text-transparent">
                      Give A Memory.
                    </span>
                  </h2>
                  <p className="text-[#4a4a4a] text-body-lg max-w-md mx-auto lg:mx-0 mb-6">
                    Surprise someone special with an unforgettable experience, delivered straight to their phone.
                  </p>
                  <Link
                    href="/gift"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300"
                  >
                    Send a Gift Card
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                </div>
                <div className="flex-1 w-full max-w-md">
                  <div className="grid grid-cols-2 gap-3">
                    {giftIdeas.map((exp) => (
                      <Link
                        key={exp.id}
                        href={`/experiences/${exp.id}`}
                        className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[#f0f0f0]"
                      >
                        <img
                          src={exp.image}
                          alt={exp.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <p className="text-white text-caption font-medium line-clamp-1">{exp.title}</p>
                          <p className="text-white/60 text-[10px]">MK {exp.price.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── AI Concierge Teaser ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 my-10">
          <Link href="/experiences" className="relative rounded-2xl overflow-hidden block group border border-[#dddddd] bg-[#fafafa]">
            <div className="relative z-10 p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff385c] to-[#9F3BFF] flex items-center justify-center flex-shrink-0 shadow-[0_4px_16px_rgba(255,56,92,0.2)]">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-heading-xl font-bold text-[#222222] mb-1">Not sure what you&apos;re in the mood for?</h2>
                  <p className="text-[#4a4a4a] text-body-lg">Tell us how you feel, and we&apos;ll find the perfect experience.</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#dddddd] text-[#222222] font-semibold text-body-sm group-hover:border-[#222222] transition-all">
                    Explore All
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* ─── Large CTA ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 my-12">
          <div className="relative rounded-2xl overflow-hidden bg-[#f7f7f7] border border-[#dddddd] p-10 sm:p-16 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#ff385c]/5 via-[#9F3BFF]/5 to-[#FF7A18]/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-heading-xl sm:text-display-sm md:text-display-md font-bold text-[#222222] mb-4 leading-tight">
                Life is made of moments.
              </h2>
              <p className="text-[#4a4a4a] text-body-lg sm:text-heading-md max-w-lg mx-auto mb-8 leading-relaxed">
                Don&apos;t spend another weekend wondering what to do.
              </p>
              <Link
                href="/experiences"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl bg-[#ff385c] text-white font-semibold text-body hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300"
              >
                Discover Experiences
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
