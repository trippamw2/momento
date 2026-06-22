"use client";

import HeroSection from "@/components/HeroSection";
import ContentRail from "@/components/ContentRail";
import Link from "next/link";
import { useState, useMemo } from "react";
import { experiences, CITIES, experiencesNear } from "@/lib/data";
import { useGeolocation } from "@/hooks/useGeolocation";
import { AFRICAN_CITY_COORDS, formatDistance, haversineDistance } from "@/lib/geo";

export default function Home() {
  const { coords, loading } = useGeolocation();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const cityList = useMemo(() => {
    const mainCities = ["Lilongwe", "Blantyre", "Lusaka", "Harare", "Johannesburg", "Dar es Salaam", "Nairobi"];
    return mainCities.filter((c) => CITIES.includes(c));
  }, []);

  const userLocation = useMemo(() => {
    if (coords) return coords;
    if (selectedCity && AFRICAN_CITY_COORDS[selectedCity]) {
      return AFRICAN_CITY_COORDS[selectedCity];
    }
    return AFRICAN_CITY_COORDS["Lilongwe"];
  }, [coords, selectedCity]);

  const sortedByProximity = useMemo(() => {
    return experiencesNear(userLocation);
  }, [userLocation]);

  const nearestCity = useMemo(() => {
    let nearest = "Lilongwe";
    let shortest = Infinity;
    for (const [city, cityCoords] of Object.entries(AFRICAN_CITY_COORDS)) {
      const d = haversineDistance(userLocation, cityCoords);
      if (d < shortest) {
        shortest = d;
        nearest = city;
      }
    }
    return { name: nearest, distance: formatDistance(shortest) };
  }, [userLocation]);

  const featured = sortedByProximity.filter((e) => e.rating >= 4.8).slice(0, 8);
  const nearby = sortedByProximity.slice(0, 8);
  const becauseRelax = experiences.filter((e) => e.mood.includes("Relax")).slice(0, 8);
  const newThisWeek = experiences.filter((e) => e.featured).slice(0, 8);
  const affordable = experiences.filter((e) => e.price <= 50000).slice(0, 8);
  const peopleLoving = [...experiences].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);
  const weekendPlans = experiences.filter((e) => e.mood.includes("Celebrate") || e.mood.includes("Escape")).slice(0, 8);
  const cityExperiences = experiences.filter((e) => e.city === nearestCity.name).slice(0, 8);
  const giftIdeas = experiences.filter((e) => e.mood.includes("Treat Myself") || e.mood.includes("Romantic")).slice(0, 8);

  return (
    <div>
      <HeroSection />

      {/* ─── City Selector ─── */}
      <section className="relative z-10 -mt-32 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption font-medium text-[#6B7280] uppercase tracking-wider mr-1">
              {coords ? `📍 ${nearestCity.name}` : "Discover in"}
            </span>
            {cityList.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-1.5 rounded-full text-body-sm font-medium transition-all duration-200 ${
                  selectedCity === city
                    ? "bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white"
                    : "bg-white/[0.04] border border-white/[0.08] text-[#A1A1AA] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="relative z-10 pb-16 space-y-1">
        <ContentRail
          title={coords ? `Near You in ${nearestCity.name}` : "Experiences Near You"}
          experiences={nearby}
          viewAllHref="/experiences?nearby=true"
        />
        <ContentRail title="Trending This Weekend" experiences={featured} viewAllHref="/experiences" />
        <ContentRail title={`Popular in ${nearestCity.name}`} experiences={cityExperiences} viewAllHref={`/experiences?city=${nearestCity.name}`} />
        <ContentRail title="Because You Like Relaxing" experiences={becauseRelax} viewAllHref="/experiences?mood=relax" />
        <ContentRail title="New Experiences This Week" experiences={newThisWeek} viewAllHref="/experiences" />
        <ContentRail title="Affordable Experiences" experiences={affordable} viewAllHref="/experiences?price=0-50000" />
        <ContentRail title="People Are Loving These" experiences={peopleLoving} viewAllHref="/experiences" />

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
                    {giftIdeas.slice(0, 4).map((exp) => (
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

        <ContentRail title="What Are You Planning This Weekend?" experiences={weekendPlans} viewAllHref="/experiences" />

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
