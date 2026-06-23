"use client";

import { useMemo } from "react";
import HeroSection from "@/components/HeroSection";
import ContentRail from "@/components/ContentRail";
import Link from "next/link";
import { experiences, discoveryRails, railOrder, getExperiencesByMood } from "@/lib/data";

export default function Home() {
  const rails = useMemo(() => {
    return railOrder
      .map((key) => {
        const rail = discoveryRails[key];
        return { key, title: rail.title, subtitle: undefined, experiences: rail.getExperiences() };
      })
      .filter((r) => r.experiences.length > 0);
  }, []);

  const giftIdeas = useMemo(() => {
    const all = getExperiencesByMood("Indulge").concat(getExperiencesByMood("Romantic"));
    return all.sort(() => Math.random() - 0.5).slice(0, 4);
  }, []);

  return (
    <div>
      <HeroSection />

      <div className="relative z-10 -mt-16 pb-16 space-y-1">
        {rails.map((rail) => (
          <ContentRail
            key={rail.key}
            title={rail.title}
            subtitle={rail.subtitle}
            experiences={rail.experiences}
            viewAllHref="/experiences"
          />
        ))}

        {/* ─── Gift A Moment ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 my-10">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF2D7A]/10 via-[#9F3BFF]/5 to-[#FF7A18]/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF2D7A]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#9F3BFF]/10 rounded-full blur-3xl" />
            <div className="relative z-10 p-8 sm:p-12 border border-white/[0.06] rounded-2xl">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-caption text-[#A1A1AA] mb-4">
                    <span>🎁</span> Gift A Moment
                  </div>
                  <h2 className="text-heading-xl sm:text-display-sm font-bold text-white mb-3 leading-tight">
                    Give More Than A Gift.
                    <span className="block bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] bg-clip-text text-transparent">
                      Give A Memory.
                    </span>
                  </h2>
                  <p className="text-[#A1A1AA] text-body-lg max-w-md mx-auto lg:mx-0 mb-6">
                    Surprise someone special with an unforgettable experience, delivered straight to their phone.
                  </p>
                  <Link
                    href="/gift"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300"
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
                        className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[#111827]"
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
          <Link href="/experiences" className="relative rounded-2xl overflow-hidden block group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#9F3BFF]/10 via-[#FF2D7A]/5 to-[#0A101B] border border-white/[0.06] rounded-2xl" />
            <div className="relative z-10 p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF2D7A] to-[#9F3BFF] flex items-center justify-center flex-shrink-0 shadow-[0_8px_32px_rgba(255,45,122,0.3)]">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-heading-xl font-bold text-white mb-1">Not sure what you&apos;re in the mood for?</h2>
                  <p className="text-[#A1A1AA] text-body-lg">Tell us how you feel, and we&apos;ll find the perfect experience.</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.08] text-white font-semibold text-body-sm backdrop-blur-md border border-white/[0.08] group-hover:bg-white/[0.12] transition-all">
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
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#111827] to-[#0A101B] border border-[rgba(255,255,255,0.06)] p-10 sm:p-16 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#FF2D7A]/5 via-[#9F3BFF]/5 to-[#FF7A18]/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-heading-xl sm:text-display-sm md:text-display-md font-bold text-white mb-4 leading-tight">
                Life is made of moments.
              </h2>
              <p className="text-[#A1A1AA] text-body-lg sm:text-heading-md max-w-lg mx-auto mb-8 leading-relaxed">
                Don&apos;t spend another weekend wondering what to do.
              </p>
              <Link
                href="/experiences"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body hover:shadow-[0_8px_32px_rgba(255,45,122,0.4)] transition-all duration-300"
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
