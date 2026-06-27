"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import HeroSection from "@/components/HeroSection";
import ContentRail from "@/components/ContentRail";
import Link from "next/link";
import { getExperiences } from "@/lib/api-client";
import { transformExperience } from "@/lib/transform";
import { Experience } from "@/lib/types";
import { experiences as mockExperiences } from "@/lib/data";
import { useGeolocation, getDistance, formatDist } from "@/lib/use-geolocation";
import { findNearestCity, getLocationSuggestions, getSmartRadius, getPopularCities, haversineDistance, formatDistance, getTravelMode } from "@/lib/geo";
import { getPersonalizedRecommendations, getRecommendedCategories, hasUserInteractions, trackView } from "@/lib/recommendations";
import { getPopularInArea } from "@/lib/geofence";
import DistanceBadge from "@/components/DistanceBadge";
import AIConcierge from "@/components/AIConcierge";
import type { LocationSuggestion } from "@/lib/geo";

const RAILS: { key: string; title: string; filter: (e: Experience) => boolean }[] = [
  { key: "trending", title: "Trending Right Now", filter: (e: Experience) => e.rating >= 4.7 },
  { key: "nearby", title: "Near You", filter: (_e: Experience) => true },
  { key: "popular", title: "Popular Around You", filter: (_e: Experience) => true },
  { key: "weekend", title: "Perfect For This Weekend", filter: (e: Experience) => parseInt(e.duration) > 0 && parseInt(e.duration) <= 4 },
  { key: "most-saved", title: "Most Saved", filter: () => true },
  { key: "date-night", title: "Date Night", filter: (e: Experience) => e.category === "Date Night" },
  { key: "pool-chill", title: "Pool & Chill", filter: (e: Experience) => e.category === "Pool & Chill" },
  { key: "spa-wellness", title: "Spa & Wellness", filter: (e: Experience) => e.category === "Spa & Wellness" },
  { key: "brunch-dining", title: "Brunch & Dining", filter: (e: Experience) => e.category === "Brunch & Dining" },
  { key: "staycation", title: "Staycations", filter: (e: Experience) => e.category === "Staycation" },
  { key: "staff-picks", title: "Staff Picks", filter: (e: Experience) => e.rating >= 4.8 },
  { key: "affordable", title: "Affordable Experiences", filter: (e: Experience) => e.price <= 50000 },
  { key: "personalized", title: "Just For You", filter: () => true },
];

const RAIL_ORDER = [
  "trending", "personalized", "nearby", "popular", "weekend", "most-saved",
  "date-night", "pool-chill", "spa-wellness", "brunch-dining",
  "staycation", "staff-picks", "affordable",
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
  const geo = useGeolocation();
  const [detectedCity, setDetectedCity] = useState<string | null>(null);

  // ─── Location Search ───
  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Update suggestions as user types
  useEffect(() => {
    if (locationQuery.trim().length >= 1) {
      setSuggestions(getLocationSuggestions(locationQuery));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [locationQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-detect city from GPS
  useEffect(() => {
    if (geo.position && !detectedCity) {
      const city = findNearestCity(geo.position.lat, geo.position.lng);
      if (city) setDetectedCity(city);
    }
  }, [geo.position, detectedCity]);

  // Auto-request GPS on mount
  useEffect(() => {
    if (!geo.position && !geo.loading && !geo.error && geo.permission === "prompt") {
      const t = setTimeout(() => geo.requestPosition(), 2000);
      return () => clearTimeout(t);
    }
  }, []);

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
        if (key === "nearby") {
          // Filter by detected city if we know it
          if (detectedCity) {
            filtered = filtered.filter((e) => e.location === detectedCity);
          }
          if (geo.position) {
            filtered = [...filtered]
              .map((e) => ({
                ...e,
                distance: formatDist(getDistance(geo.position!, e.coordinates)),
              }))
              .sort((a, b) => {
                const dA = getDistance(geo.position!, a.coordinates);
                const dB = getDistance(geo.position!, b.coordinates);
                return dA - dB;
              });
          }
        }
        if (key === "popular") {
          // Show highest-rated experiences near the user's detected city
          if (detectedCity) {
            filtered = filtered.filter((e) => e.location === detectedCity);
          } else if (geo.position) {
            const nearbyIds = getPopularInArea(geo.position, filtered.map((e) => e.id));
            if (nearbyIds.length > 0) {
              filtered = filtered.filter((e) => nearbyIds.includes(e.id));
            }
          }
          filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        }
        if (key === "personalized") {
          filtered = getPersonalizedRecommendations(filtered, geo.position ?? undefined);
        }
        return { key, title: cfg.title, experiences: shuffle(filtered).slice(0, 8) };
      })
      .filter((r) => r && r.experiences.length > 0) as { key: string; title: string; experiences: Experience[] }[];
  }, [experiences, geo.position, detectedCity]);

  const giftIdeas = useMemo(() => {
    if (experiences.length === 0) return [];
    const all = [
      ...experiences.filter((e) => e.mood.includes("Luxurious" as any)),
      ...experiences.filter((e) => e.mood.includes("Romantic" as any)),
    ];
    return shuffle(all).slice(0, 4);
  }, [experiences]);

  // ─── Helper components ───

  const GridCards = ({ title, items }: { title: string; items: Experience[] }) => (
    <section className="mb-10 px-4 sm:px-8">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-heading-lg sm:text-heading-xl font-bold text-white">{title}</h2>
        <Link href="/experiences" className="text-body-sm text-[#CBD5E1] hover:text-[#FF2D7A] transition-colors duration-200 flex items-center gap-1 flex-shrink-0">
          See all
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((exp) => (
          <Link key={exp.id} href={`/experiences/${exp.id}`} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#1A2332]">
            <img src={exp.image} alt={exp.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
              <p className="text-white text-body-sm font-bold line-clamp-1">{exp.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-400 text-xs">★ {exp.rating}</span>
                <span className="text-white/50 text-caption">MK {exp.price.toLocaleString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );

  const SectionDivider = ({ title }: { title: string }) => (
    <div className="px-4 sm:px-8 my-6 sm:my-8">
      <div className="flex items-center gap-4">
        <span className="w-1 h-6 rounded-full bg-[#FF2D7A]" />
        <h3 className="text-heading-md sm:text-heading-lg font-bold text-white tracking-tight">{title}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
      </div>
    </div>
  );

  const FeaturedCard = ({ exp }: { exp: Experience }) => (
    <Link href={`/experiences/${exp.id}`} className="block mx-4 sm:mx-8 mb-10 group">
      <div className="relative aspect-[21/9] max-h-[420px] rounded-2xl overflow-hidden bg-[#0a0a0a]">
        <img src={exp.image} alt={exp.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-caption text-white/90 font-semibold mb-3">
            Editor&apos;s Pick
          </div>
          <h2 className="text-heading-xl sm:text-display-sm font-bold text-white mb-2 leading-tight">{exp.title}</h2>
          <p className="text-white/70 text-body-sm sm:text-body max-w-xl line-clamp-2">{exp.subtitle}</p>
          <div className="flex items-center gap-4 mt-3 text-white/60 text-caption">
            <span className="flex items-center gap-1">★ {exp.rating}</span>
            <span>MK {exp.price.toLocaleString()}</span>
            <span>{exp.duration}</span>
          </div>
        </div>
      </div>
    </Link>
  );

  // Build rails map for easy lookup
  const railsMap = useMemo(() => {
    const map: Record<string, { key: string; title: string; experiences: Experience[] }> = {};
    rails.forEach(r => { map[r.key] = r; });
    return map;
  }, [rails]);

  // Featured experience (highest rated)
  const featured = useMemo(() => {
    return experiences.find(e => e.rating >= 4.9) || experiences[0] || null;
  }, [experiences]);

  return (
    <div className="overflow-x-hidden">
      <HeroSection />

      <div className="relative z-10 -mt-12 sm:-mt-16 pb-16 space-y-1">
        
        {/* ─── City Detection Banner ─── */}
        {detectedCity && (
          <div className="px-4 sm:px-8 pt-4 pb-0">
            <div className="flex items-center gap-2 text-body-sm text-[#CBD5E1]">
              <svg className="w-4 h-4 text-[#FF2D7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>Showing experiences near <strong>{detectedCity}</strong></span>
            </div>
          </div>
        )}
        {geo.loading && !detectedCity && (
          <div className="px-4 sm:px-8 pt-4 pb-0">
            <p className="text-caption text-text-tertiary animate-pulse">Detecting your location...</p>
          </div>
        )}
        {geo.error && !detectedCity && (
          <div className="px-4 sm:px-8 pt-4 pb-0">
            <div className="flex items-center gap-3 text-caption text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="flex-1">Enable location to see experiences near you</span>
              <button
                onClick={() => geo.requestPosition()}
                className="shrink-0 text-[11px] font-semibold text-white bg-amber-600/80 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-all"
              >
                Enable GPS
              </button>
            </div>
          </div>
        )}

        {/* ─── Location Search ─── */}
        <div ref={searchRef} className="px-4 sm:px-8 pt-3 pb-1">
          <div className="relative max-w-md">
            <div className="flex items-center gap-2 bg-[#1A2332] border border-white/[0.08] rounded-xl px-3.5 py-2.5 focus-within:border-[#FF2D7A]/40 focus-within:shadow-[0_0_0_2px_rgba(255,45,122,0.1)] transition-all">
              <svg className="w-4 h-4 text-[#94A3B8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search for a city or area..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className="flex-1 bg-transparent text-white text-body-sm placeholder-[#64748B] outline-none"
              />
              {locationQuery && (
                <button onClick={() => { setLocationQuery(""); setSuggestions([]); setSelectedCity(null); }} className="text-[#64748B] hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A2332] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl z-50">
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setSelectedCity(s.name);
                      setLocationQuery(s.name);
                      setShowSuggestions(false);
                      setDetectedCity(s.name);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.06] transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#FF2D7A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <div>
                      <p className="text-white text-caption font-medium">{s.name}</p>
                      <p className="text-[#64748B] text-[11px]">{s.region} Region{s.isUrban ? " · Urban" : ""}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Trending ─── */}
        {railsMap.trending && (
          <ContentRail title={railsMap.trending.title} experiences={railsMap.trending.experiences} viewAllHref="/experiences" />
        )}
        
        {/* ─── Personalized ─── */}
        {railsMap.personalized && (
          <GridCards title={railsMap.personalized.title} items={railsMap.personalized.experiences} />
        )}

        {/* ─── GPS: Near You ─── */}
        {railsMap.nearby && (
          <ContentRail
            title={railsMap.nearby.title}
            experiences={railsMap.nearby.experiences}
            viewAllHref="/experiences"
            subtitle={geo.position ? "Sorted by distance" : "Enable location for nearby picks"}
          />
        )}

        {/* ─── Popular Around You ─── */}
        {railsMap.popular && (
          <ContentRail
            title={railsMap.popular.title}
            experiences={railsMap.popular.experiences}
            viewAllHref="/experiences"
            subtitle={detectedCity ? `Top-rated in ${detectedCity}` : "Highest rated nearby"}
          />
        )}

        {/* ─── Weekend & Most Saved ─── */}
        {railsMap.weekend && (
          <ContentRail title={railsMap.weekend.title} experiences={railsMap.weekend.experiences} viewAllHref="/experiences" />
        )}
        
        {railsMap['most-saved'] && (
          <GridCards title={railsMap['most-saved'].title} items={railsMap['most-saved'].experiences} />
        )}

        {/* ─── Featured Experience ─── */}
        {featured && <FeaturedCard exp={featured} />}

        {/* ─── Date Night & Pool Chill ─── */}
        <SectionDivider title="Date Night & Pool & Chill" />
        
        {railsMap['date-night'] && (
          <ContentRail title={railsMap['date-night'].title} experiences={railsMap['date-night'].experiences} viewAllHref="/experiences" />
        )}
        
        {railsMap['pool-chill'] && (
          <GridCards title={railsMap['pool-chill'].title} items={railsMap['pool-chill'].experiences} />
        )}

        {/* ─── Social Proof ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 my-6 sm:my-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 py-4 sm:py-5 px-4 sm:px-8 rounded-2xl bg-[#111827] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["/avatar1.jpg", "/avatar2.jpg", "/avatar3.jpg"].map((src, i) => (
                  <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">
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
                <p className="text-caption text-[#CBD5E1] font-medium">Trusted by 10,000+ explorers</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-caption text-[#CBD5E1]">
              <span className="flex items-center gap-1">✓ Curated experiences</span>
              <span className="hidden xs:inline flex items-center gap-1">✓ Instant booking</span>
              <span className="flex items-center gap-1">✓ Free cancellation</span>
            </div>
          </div>
        </section>

        {/* ─── Spa, Brunch & Staycation ─── */}
        <SectionDivider title="Spa, Brunch & Staycations" />
        
        {railsMap['spa-wellness'] && (
          <ContentRail title={railsMap['spa-wellness'].title} experiences={railsMap['spa-wellness'].experiences} viewAllHref="/experiences" />
        )}
        
        {railsMap['brunch-dining'] && (
          <ContentRail title={railsMap['brunch-dining'].title} experiences={railsMap['brunch-dining'].experiences} viewAllHref="/experiences" />
        )}
        
        {railsMap.staycation && (
          <ContentRail title={railsMap.staycation.title} experiences={railsMap.staycation.experiences} viewAllHref="/experiences" />
        )}

        {/* ─── Gift A Moment ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 my-10">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-[#05070B]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF2D7A]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF7A18]/10 rounded-full blur-3xl" />
            <div className="relative z-10 p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A2332] border border-white/[0.1] text-caption text-[#CBD5E1] mb-4">
                    Gift A Moment
                  </div>
                  <h2 className="text-heading-xl sm:text-display-sm font-bold text-white mb-3 leading-tight">
                    Give More Than A Gift.
                    <span className="block bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] bg-clip-text text-transparent">
                      Give A Memory.
                    </span>
                  </h2>
                  <p className="text-[#CBD5E1] text-body-lg max-w-md mx-auto lg:mx-0 mb-6">
                    Surprise someone special with an unforgettable experience, delivered straight to their phone.
                  </p>
                  <Link
                    href="/gift"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#FF2D7A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,45,122,0.3)] transition-all duration-300"
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
                        className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[#1A2332]"
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

        {railsMap['staff-picks'] && (
          <GridCards title={railsMap['staff-picks'].title} items={railsMap['staff-picks'].experiences} />
        )}
        
        {railsMap.affordable && (
          <ContentRail title={railsMap.affordable.title} experiences={railsMap.affordable.experiences} viewAllHref="/experiences" />
        )}

        {/* ─── AI Concierge ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 my-10">
          <AIConcierge />
        </section>

        {/* ─── Large CTA ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 my-12">
          <div className="relative rounded-2xl overflow-hidden bg-[#111827] border border-white/[0.1] p-10 sm:p-16 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#FF2D7A]/8 via-[#FF7A18]/8 to-[#FF2D7A]/8 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-heading-xl sm:text-display-sm md:text-display-md font-bold text-white mb-4 leading-tight">
                Life is made of moments.
              </h2>
              <p className="text-[#CBD5E1] text-body-lg sm:text-heading-md max-w-lg mx-auto mb-8 leading-relaxed">
                Don&apos;t spend another weekend wondering what to do.
              </p>
              <Link
                href="/experiences"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl bg-[#FF2D7A] text-white font-semibold text-body hover:shadow-[0_4px_16px_rgba(255,45,122,0.3)] transition-all duration-300"
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
