"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TIERS,
  ACHIEVEMENT_DEFS,
  calculateTier,
  TIER_MAP,
  formatPoints,
  calculateStreak,
  getStreakMilestones,
  type TierName,
  type TierConfig,
} from "@/lib/loyalty-engine";

interface LoyaltyData {
  balance: number;
  lifetime_points: number;
  tier: string;
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20 bg-[#05070B]">
      <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
    </div>
  );
}

function StreakDisplay() {
  const streak = useMemo(() => calculateStreak(), []);
  const milestones = getStreakMilestones();

  // Find next milestone
  const nextMilestone = milestones.find((m) => m.weeks > streak.current);
  const prevMilestone = [...milestones].reverse().find((m) => m.weeks <= streak.current);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#111827] border border-white/[0.08] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Streak counter */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg shrink-0 ${
            streak.current > 0 ? "bg-gradient-to-br from-orange-500 to-red-500" : "bg-[#1E293B]"
          }`}>
            {streak.current > 0 ? "🔥" : "⏳"}
          </div>
          <div>
            <p className="text-heading-md font-bold text-[#F1F5F9]">
              {streak.current > 0 ? `${streak.current} week${streak.current > 1 ? "s" : ""}` : "No active streak"}
            </p>
            <p className="text-body-sm text-[#94A3B8]">
              {streak.current > 0
                ? `Longest: ${streak.longest} week${streak.longest > 1 ? "s" : ""}`
                : "Book experiences weekly to start a streak"}
            </p>
          </div>
        </div>

        {/* Streak milestones */}
        <div className="flex-1">
          <p className="text-caption text-[#94A3B8] mb-3">
            {nextMilestone
              ? `${nextMilestone.weeks - streak.current} more week${nextMilestone.weeks - streak.current > 1 ? "s" : ""} to "${nextMilestone.label}"`
              : "All milestones reached!"}
          </p>
          <div className="flex items-center gap-2">
            {milestones.map((m, i) => {
              const unlocked = streak.current >= m.weeks;
              return (
                <div key={m.weeks} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                    unlocked
                      ? "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 shadow-md"
                      : "bg-[#1E293B] border-white/[0.1]"
                  }`}>
                    <span className={unlocked ? "" : "opacity-30"}>{m.icon}</span>
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${unlocked ? "text-[#CBD5E1]" : "text-[#64748B]"}`}>
                    {m.weeks}w
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) {
      setLoading(false);
      setSignedIn(false);
      return;
    }
    setSignedIn(true);

    fetch("/api/loyalty/points", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch((err) => console.error("Loyalty points fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  if (!signedIn) {
    return (
      <div className="min-h-screen pt-20 pb-16 flex items-center justify-center bg-[#05070B]">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-[#111827] flex items-center justify-center mx-auto mb-6 border border-white/[0.08]">
            <span className="text-3xl">👑</span>
          </div>
          <h1 className="text-heading-xl font-bold text-[#F1F5F9] mb-2">Loyalty & Rewards</h1>
          <p className="text-[#CBD5E1] text-body mb-8">
            Sign in to track your loyalty rewards, earn points, and unlock exclusive tiers.
          </p>
          <Link
            href="/experiences"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all"
          >
            Browse Experiences
          </Link>
        </div>
      </div>
    );
  }

  const tier = TIER_MAP[data?.tier as TierName] || TIER_MAP.bronze;
  const tierInfo = calculateTier(data?.lifetime_points || 0);
  const nextTierConfig = tierInfo.nextTier ? TIER_MAP[tierInfo.nextTier] : null;
  const points = data?.balance || 0;
  const lifetimePoints = data?.lifetime_points || 0;

  // Determine unlocked achievements
  const unlockedAchievements = ACHIEVEMENT_DEFS.filter((a) => {
    // Simple heuristic for display: if an achievement's requirement appears met based on stats
    // Since we don't have full stats from the API, we'll show them all with progress
    return false;
  });

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#05070B]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-10">
        {/* ─── Hero ─── */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF0F73]/10 to-[#FF7A1A]/10 border border-[#FF0F73]/20 text-[#FF0F73] text-caption font-semibold mb-4">
            <span>👑</span> Loyalty Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#F1F5F9] mb-3 tracking-tight">
            Loyalty & Rewards
          </h1>
          <p className="text-[#CBD5E1] text-body-lg max-w-xl mx-auto">
            Earn points, unlock tiers, and experience more. Every booking brings you closer to exclusive perks.
          </p>
        </section>

        {/* ─── Points Balance ─── */}
        <section>
          <div className="max-w-md mx-auto text-center p-8 rounded-3xl bg-gradient-to-br from-[#111827] to-[#0A0E17] border border-white/[0.08] shadow-sm">
            <p className="text-caption text-[#94A3B8] uppercase tracking-wider mb-1">Your Balance</p>
            <p className="text-5xl sm:text-6xl font-bold text-[#F1F5F9] mb-1">{formatPoints(points)}</p>
            <p className="text-body-sm text-[#64748B]">
              {formatPoints(lifetimePoints)} lifetime points
            </p>
          </div>
        </section>

        {/* ─── Tier Card ─── */}
        <section>
          <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-4">Current Tier</h2>
          <div className="p-6 sm:p-8 rounded-3xl bg-[#111827] border border-white/[0.08] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Tier icon + name */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg shrink-0"
                  style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.colorEnd})` }}
                >
                  {tier.icon}
                </div>
                <div>
                  <p className="text-heading-md font-bold text-[#F1F5F9]">
                    {tier.name.charAt(0).toUpperCase() + tier.name.slice(1)}
                  </p>
                  <p className="text-body-sm text-[#94A3B8]">{tier.multiplier}x points multiplier</p>
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="flex-1 min-w-0">
                {nextTierConfig ? (
                  <>
                    <div className="flex items-center justify-between text-caption text-[#94A3B8] mb-1.5">
                      <span>
                        {formatPoints(lifetimePoints)} / {formatPoints(nextTierConfig.minPoints)} to{" "}
                        {nextTierConfig.name.charAt(0).toUpperCase() + nextTierConfig.name.slice(1)}
                      </span>
                      <span className="font-medium text-[#CBD5E1]">{Math.round(tierInfo.progress)}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#1E293B] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, tierInfo.progress)}%` }}
                      />
                    </div>
                    <p className="text-caption text-[#64748B] mt-1.5">
                      {formatPoints(tierInfo.pointsToNext)} more points to unlock {nextTierConfig.icon}{" "}
                      {nextTierConfig.name.charAt(0).toUpperCase() + nextTierConfig.name.slice(1)}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 text-body-sm font-medium">
                    <span className="text-2xl">👑</span>
                    Maximum Tier — You&apos;re at the top!
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Tier Benefits Comparison ─── */}
        <section>
          <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-4">Tier Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {TIERS.map((t) => {
              const isCurrent = t.name === tier.name;
              return (
                <div
                  key={t.name}
                  className={`p-5 rounded-2xl border transition-all duration-300 ${
                    isCurrent
                      ? "bg-[#1A2332] border-[#FF0F73]/30 shadow-[0_0_20px_rgba(255, 15, 115, 0.1)]"
                      : "bg-[#111827] border-white/[0.08] opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* Tier header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{t.icon}</span>
                    <span
                      className="text-heading-sm font-bold bg-clip-text text-transparent"
                      style={{ backgroundImage: `linear-gradient(135deg, ${t.color}, ${t.colorEnd})` }}
                    >
                      {t.name.charAt(0).toUpperCase() + t.name.slice(1)}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-[#FF0F73]/15 text-[#FF0F73] text-[10px] font-semibold">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Min points */}
                  <p className="text-caption text-[#64748B] mb-2">
                    {t.minPoints === 0 ? "Start here" : `${formatPoints(t.minPoints)} points`}
                  </p>
                  <p className="text-caption text-[#94A3B8] mb-3">{t.multiplier}x multiplier</p>

                  {/* Benefits */}
                  <ul className="space-y-1.5">
                    {t.benefits.map((b, i) => (
                      <li key={i} className="text-caption text-[#CBD5E1] flex items-start gap-1.5">
                        <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Achievements ─── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-lg font-bold text-[#F1F5F9]">Achievements</h2>
            <span className="text-caption text-[#94A3B8]">
              {unlockedAchievements.length} / {ACHIEVEMENT_DEFS.length} unlocked
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ACHIEVEMENT_DEFS.map((ach) => {
              const unlocked = false; // MVP: all locked until we have full stats
              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    unlocked
                      ? "bg-[#111827] border-emerald-500/20"
                      : "bg-[#111827] border-white/[0.08] opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-2xl ${unlocked ? "" : "grayscale opacity-50"}`}>{ach.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-body-sm font-semibold ${unlocked ? "text-[#F1F5F9]" : "text-[#94A3B8]"}`}>
                        {ach.name}
                      </p>
                      <p className="text-caption text-[#64748B] truncate">{ach.description}</p>
                    </div>
                    {unlocked && (
                      <span className="ml-auto text-emerald-400 shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </span>
                    )}
                  </div>
                  {/* Progress bar for locked achievements */}
                  {!unlocked && (
                    <div className="w-full h-1.5 rounded-full bg-[#1E293B] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF0F73] transition-all duration-500"
                        style={{ width: `${Math.min(100, (ach.check({ totalBookings: 0, totalSpent: 0, totalReviews: 0, totalReferrals: 0, totalGifts: 0, totalGifted: 0, totalShares: 0, daysSinceSignup: 0, citiesVisited: [], categories: [], consecutiveBookings: 0, birthdayBooked: false }).current / ach.check({ totalBookings: 0, totalSpent: 0, totalReviews: 0, totalReferrals: 0, totalGifts: 0, totalGifted: 0, totalShares: 0, daysSinceSignup: 0, citiesVisited: [], categories: [], consecutiveBookings: 0, birthdayBooked: false }).requirement) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── How to Earn Points ─── */}
        <section>
          <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-4">How to Earn Points</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: "📅", title: "Book Experiences", desc: "10 pts per MK 1,000 spent", link: "/experiences" },
              { icon: "✍️", title: "Write Reviews", desc: "50 pts per review", link: null },
              { icon: "🤝", title: "Refer Friends", desc: "200 pts per referral", link: null },
              { icon: "🎁", title: "Send Gifts", desc: "5 pts per MK 1,000 gifted", link: "/gift" },
              { icon: "📤", title: "Share on Social", desc: "20 pts per share", link: null },
              { icon: "🎉", title: "Sign Up Bonus", desc: "100 pts on joining", link: null },
              { icon: "🎂", title: "Birthday Bonus", desc: "500 pts on your birthday", link: null },
              { icon: "💎", title: "Tier Multiplier", desc: "Earn up to 3x points as VIP", link: null },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-2xl bg-[#111827] border border-white/[0.08] hover:border-white/[0.15] transition-all"
              >
                <span className="text-2xl block mb-2">{item.icon}</span>
                <h3 className="text-body-sm font-bold text-[#F1F5F9] mb-0.5">{item.title}</h3>
                <p className="text-caption text-[#64748B]">{item.desc}</p>
                {item.link && (
                  <Link
                    href={item.link}
                    className="inline-block mt-2 text-caption font-medium text-[#FF0F73] hover:text-[#FF7A1A] transition-colors"
                  >
                    {item.link === "/experiences" ? "Browse experiences →" : "Start gifting →"}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Booking Streak ─── */}
        <section>
          <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-4">Booking Streak</h2>
          <StreakDisplay />
        </section>

        {/* ─── Points History ─── */}
        <section>
          <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-4">Points History</h2>
          <div className="p-8 rounded-3xl bg-[#111827] border border-white/[0.08] text-center shadow-sm">
            <span className="text-3xl block mb-3">📊</span>
            <p className="text-[#CBD5E1] text-body-sm mb-1">Your points activity will appear here</p>
            <p className="text-caption text-[#64748B]">
              Start booking experiences to earn points and track your progress.
            </p>
            <Link
              href="/experiences"
              className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all"
            >
              Explore Experiences
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
