import HeroSection from "@/components/HeroSection";
import ContentRail from "@/components/ContentRail";
import Link from "next/link";
import { collections, collectionOrder } from "@/lib/data";

export default function Home() {
  return (
    <div>
      <HeroSection />

      <div className="relative z-10 -mt-24 pb-16">
        <div className="space-y-2">
          {collectionOrder.map((key, i) => {
            const collection = collections[key];
            return (
              <ContentRail
                key={key}
                title={collection.title}
                experiences={collection.getExperiences()}
                viewAllHref="/experiences"
              />
            );
          })}
        </div>

        {/* ─── CTA Section ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-12 mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#111827] to-[#0A101B] border border-[rgba(255,255,255,0.06)] p-8 sm:p-12 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF2D7A]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF7A18]/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-heading-xl sm:text-display-sm font-bold text-white mb-3">
                Become a Partner
              </h2>
              <p className="text-[#A1A1AA] text-body-lg max-w-lg mx-auto mb-6">
                List your experiences on Momento and reach thousands of people looking for their next unforgettable moment.
              </p>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}