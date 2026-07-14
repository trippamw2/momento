"use client";

import { getTravelMode } from "@/lib/geo";

interface DistanceBadgeProps {
  distanceKm: number;
  showIcon?: boolean;
  showTravelTime?: boolean;
  className?: string;
}

export default function DistanceBadge({
  distanceKm,
  showIcon = true,
  showTravelTime = true,
  className = "",
}: DistanceBadgeProps) {
  const { mode, time } = getTravelMode(distanceKm);

  const Icon = mode === "walk" ? WalkingIcon : DrivingIcon;

  const distanceLabel =
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m`
      : distanceKm < 50
        ? `${distanceKm.toFixed(1)} km`
        : `${Math.round(distanceKm)} km`;

  return (
    <span
      className={`inline-flex items-center gap-1 text-caption font-medium text-[#64748B] ${className}`}
    >
      {showIcon && <Icon />}
      <span>
        {distanceLabel}
        {showTravelTime && time ? ` · ${time}` : ""}
      </span>
    </span>
  );
}

function WalkingIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function DrivingIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1m8-1l2 1m-10-4h2m-2 4h10m4-8l2 2-2 2m-6 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
