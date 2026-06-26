"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TIER_MAP, calculateTier, formatPoints } from "@/lib/loyalty-engine";
import type { TierName } from "@/lib/loyalty-engine";

interface LoyaltyData {
  balance: number;
  lifetime_points: number;
  tier: string;
}

export default function LoyaltyBadge({ minimal = false }: { minimal?: boolean }) {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) { setLoading(false); return; }

    fetch("/api/loyalty/points", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const tier = TIER_MAP[data.tier as TierName] || TIER_MAP.bronze;
  const { nextTier, progress, pointsToNext } = calculateTier(data.lifetime_points);
  const nextTierConfig = nextTier ? TIER_MAP[nextTier] : null;

  if (minimal) {
    return (
      <Link
        href="/loyalty"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111827] border border-white/[0.08] text-caption font-medium text-[#CBD5E1] hover:bg-white/5 hover:text-white transition-all"
      >
        <span>{tier.icon}</span>
        <span className="hidden sm:inline">{tier.name.charAt(0).toUpperCase() + tier.name.slice(1)}</span>
        <span className="font-bold text-white">{formatPoints(data.balance)} pts</span>
      </Link>
    );
  }

  return (
    <Link href="/loyalty" className="block group">
      <div
        className="rounded-2xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm hover:border-white/[0.15] transition-all duration-300"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Header: Icon + Name + Points */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.colorEnd})` }}
          >
            {tier.icon}
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-[#F1F5F9]">
              {tier.name.charAt(0).toUpperCase() + tier.name.slice(1)} Member
            </p>
            <p className="text-caption text-[#94A3B8]">
              {formatPoints(data.balance)} points · {formatPoints(data.lifetime_points)} lifetime
            </p>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && nextTierConfig ? (
          <div className="relative">
            <div className="flex items-center justify-between text-caption text-[#94A3B8] mb-1.5">
              <span>{formatPoints(data.lifetime_points)} / {formatPoints(nextTierConfig.minPoints)} to {nextTierConfig.name.charAt(0).toUpperCase() + nextTierConfig.name.slice(1)}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1E293B] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>

            {/* Tooltip on hover */}
            {showTooltip && (
              <div className="absolute bottom-full left-0 mb-2 w-64 p-4 rounded-xl bg-[#1A2332] border border-white/[0.1] backdrop-blur-md shadow-xl z-10">
                <p className="text-caption font-semibold text-[#F1F5F9] mb-2">
                  {nextTierConfig.icon} {nextTierConfig.name.charAt(0).toUpperCase() + nextTierConfig.name.slice(1)} benefits
                </p>
                <ul className="space-y-1">
                  {nextTierConfig.benefits.map((b, i) => (
                    <li key={i} className="text-caption text-[#CBD5E1] flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 pt-2 border-t border-white/[0.06]">
                  <p className="text-caption text-[#94A3B8]">
                    {formatPoints(pointsToNext)} more points needed
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 text-caption font-medium">
            <span>👑</span> Maximum Tier — You&apos;re at the top!
          </div>
        )}

        {/* Perks mini-cards */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Points multiplier", value: `${tier.multiplier}x` },
            { label: "Exclusive perks", value: tier.name !== "bronze" ? "✓" : "—" },
            { label: "Priority support", value: tier.name === "platinum" || tier.name === "gold" || tier.name === "vip" ? "✓" : "—" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-2 rounded-xl bg-[#0A0E17] border border-white/[0.05]">
              <p className="text-caption font-bold text-[#F1F5F9]">{stat.value}</p>
              <p className="text-caption text-[#64748B] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* View full dashboard link */}
        <div className="mt-3 text-center">
          <span className="text-caption font-medium bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] bg-clip-text text-transparent">
            View Full Dashboard →
          </span>
        </div>
      </div>
    </Link>
  );
}
