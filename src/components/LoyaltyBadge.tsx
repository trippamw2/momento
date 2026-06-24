"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LoyaltyData {
  balance: number;
  lifetime_points: number;
  tier: string;
}

const TIER_CONFIG: Record<string, { label: string; color: string; icon: string; minPoints: number; multiplier: number }> = {
  bronze: { label: "Bronze", color: "from-amber-700 to-amber-500", icon: "🥉", minPoints: 0, multiplier: 1 },
  silver: { label: "Silver", color: "from-slate-400 to-slate-300", icon: "🥈", minPoints: 500, multiplier: 1.2 },
  gold: { label: "Gold", color: "from-yellow-500 to-yellow-300", icon: "🥇", minPoints: 2000, multiplier: 1.5 },
  platinum: { label: "Platinum", color: "from-cyan-600 to-cyan-400", icon: "💎", minPoints: 5000, multiplier: 2 },
};

export default function LoyaltyBadge({ minimal = false }: { minimal?: boolean }) {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("momento-auth-token");
    if (!token) { setLoading(false); return; }

    fetch("/api/loyalty/points", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const tier = TIER_CONFIG[data.tier] || TIER_CONFIG.bronze;
  const nextTier = data.tier === "bronze" ? TIER_CONFIG.silver
    : data.tier === "silver" ? TIER_CONFIG.gold
    : data.tier === "gold" ? TIER_CONFIG.platinum
    : null;
  const progress = nextTier ? Math.min(100, (data.lifetime_points / nextTier.minPoints) * 100) : 100;

  if (minimal) {
    return (
      <Link
        href="/profile"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/50 text-caption font-medium text-amber-800 hover:shadow-sm transition-all"
      >
        <span>{tier.icon}</span>
        <span className="hidden sm:inline">{tier.label}</span>
        <span className="font-bold">{data.balance.toLocaleString()} pts</span>
      </Link>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-[#ebebeb] p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl shadow-lg`}>
          {tier.icon}
        </div>
        <div>
          <p className="text-body-sm font-semibold text-[#222222]">{tier.label} Member</p>
          <p className="text-caption text-[#6a6a6a]">{data.balance.toLocaleString()} points · {data.lifetime_points.toLocaleString()} lifetime</p>
        </div>
      </div>

      {nextTier && (
        <div>
          <div className="flex items-center justify-between text-caption text-[#6a6a6a] mb-1.5">
            <span>{data.lifetime_points} / {nextTier.minPoints} to {nextTier.label}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff385c] to-[#FF7A18] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: "Points per booking", value: `${tier.multiplier}x` },
          { label: "Exclusive perks", value: data.tier !== "bronze" ? "✓" : "—" },
          { label: "Priority support", value: data.tier === "platinum" || data.tier === "gold" ? "✓" : "—" },
        ].map((stat) => (
          <div key={stat.label} className="text-center p-2 rounded-xl bg-[#f5f2ef]">
            <p className="text-caption font-bold text-[#222222]">{stat.value}</p>
            <p className="text-caption text-[#6a6a6a] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
