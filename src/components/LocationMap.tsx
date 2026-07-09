"use client";

import { useState } from "react";

interface Props {
  lat: number;
  lng: number;
  location?: string;
  city?: string;
}

export default function LocationMap({ lat, lng, location, city }: Props) {
  const [loaded, setLoaded] = useState(false);

  const googleMapsUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.1] h-64 relative group">
      {/* Loading state */}
      {!loaded && (
        <div className="absolute inset-0 bg-[#0A0E17] flex items-center justify-center z-10">
          <div className="w-6 h-6 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
        </div>
      )}

      {/* Google Maps iframe */}
      <iframe
        src={googleMapsUrl}
        className="w-full h-full border-0"
        title={`Map showing ${location || city || "location"}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />

      {/* Location overlay badge */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-caption text-[#CBD5E1] border border-white/[0.1] flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#FF0F73]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {location} · {city}
        </div>
        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-[#FF0F73] text-white text-caption font-medium hover:bg-[#FF0F73]/80 transition-all shadow-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Directions
        </a>
      </div>
    </div>
  );
}
