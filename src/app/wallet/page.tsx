"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ───

interface WalletSummary {
  balance: number;
  currency: string;
  status: string;
  dailyUsed: number;
  monthlyUsed: number;
  dailyLimit: number;
  monthlyLimit: number;
  transactionCount30d: number;
}

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

interface LoyaltyData {
  points: number;
  tier: string;
  tierProgress: number;
  nextTier: string | null;
}

// ─── Helpers ───

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("experio-auth-token");
}

function formatCurrency(amount: number): string {
  return `MK ${amount.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Tier Display Config ───

const TIER_CONFIG: Record<string, { label: string; icon: string; color: string; minPoints: number }> = {
  bronze: { label: "Bronze", icon: "🥉", color: "from-amber-700 to-amber-500", minPoints: 0 },
  silver: { label: "Silver", icon: "🥈", color: "from-slate-400 to-slate-300", minPoints: 500 },
  gold: { label: "Gold", icon: "🥇", color: "from-yellow-500 to-yellow-300", minPoints: 2000 },
  platinum: { label: "Platinum", icon: "💎", color: "from-cyan-400 to-blue-400", minPoints: 5000 },
};

// ─── Transaction Icons (playful) ───

const TX_ICONS: Record<string, { icon: string; label: string }> = {
  deposit: { icon: "💰", label: "Top Up" },
  withdrawal: { icon: "🎯", label: "Withdrawal" },
  payment: { icon: "🎫", label: "Booking" },
  refund: { icon: "↩️", label: "Refund" },
  transfer_in: { icon: "📥", label: "Transfer In" },
  transfer_out: { icon: "📤", label: "Transfer Out" },
  cashback: { icon: "✨", label: "Cashback" },
  bonus: { icon: "🎁", label: "Bonus" },
  fee: { icon: "📋", label: "Fee" },
  adjustment: { icon: "🔄", label: "Adjustment" },
  gift_card_redemption: { icon: "🎀", label: "Gift Card" },
};

// ─── Action Button ───

function ActionButton({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300 active:scale-95">
        {icon}
      </div>
      <span className="text-[11px] text-white/50 group-hover:text-white/70 font-medium transition-colors">{label}</span>
    </Link>
  );
}

// ─── Main Page ───

export default function WalletPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [txLoading, setTxLoading] = useState(true);
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);

  const fetchSummary = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setError("Please sign in to view your wallet");
      return;
    }
    try {
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch wallet");
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (page: number = 0) => {
    const token = getToken();
    if (!token) return;
    setTxLoading(true);
    try {
      const res = await fetch(`/api/wallet/transactions?limit=20&offset=${page * 20}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch {
      // silent
    } finally {
      setTxLoading(false);
    }
  }, []);

  const fetchLoyalty = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/loyalty", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLoyalty(data);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchTransactions(0);
    fetchLoyalty();
  }, [fetchSummary, fetchTransactions, fetchLoyalty]);

  const tier = loyalty?.tier ? TIER_CONFIG[loyalty.tier.toLowerCase()] || TIER_CONFIG.bronze : TIER_CONFIG.bronze;
  const nextTier = loyalty?.nextTier ? TIER_CONFIG[loyalty.nextTier.toLowerCase()] : null;

  // ─── Loading State ───

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  // ─── Signed Out State ───

  if (error && !summary) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-[#111827] flex items-center justify-center mx-auto mb-6 border border-white/[0.06]">
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Experience Wallet</h1>
          <p className="text-white/50 text-sm mb-8">Sign in to view your balance, rewards, and activity.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Render ───

  return (
    <div className="min-h-screen bg-[#05070B] pt-16 pb-24">
      <div className="max-w-lg mx-auto px-4 space-y-6">

        {/* ─── Hero: Balance + Rewards ─── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A0F1A] via-[#111827] to-[#0A0E17] border border-white/[0.06] p-6 sm:p-8">
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FF0F73]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FF7A1A]/8 rounded-full blur-3xl" />

          {/* Rewards level badge */}
          {loyalty && (
            <div className="relative z-10 flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{tier.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white capitalize">{tier.label}</p>
                  <p className="text-[11px] text-white/40">{loyalty.points.toLocaleString()} points</p>
                </div>
              </div>
              {nextTier && (
                <div className="text-right">
                  <p className="text-[11px] text-white/40">{Math.round(loyalty.tierProgress)}% to {nextTier.label}</p>
                  <div className="w-20 h-1 rounded-full bg-white/10 mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] transition-all duration-1000"
                      style={{ width: `${Math.min(100, loyalty.tierProgress)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Balance */}
          <div className="relative z-10 mb-6">
            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Available Balance</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {formatCurrency(summary?.balance || 0)}
            </h1>
            <p className="text-sm text-white/30 mt-1">{summary?.currency || "MWK"}</p>
          </div>

          {/* Action Buttons: Top Up, Gift, Transfer */}
          <div className="relative z-10 flex items-center justify-center gap-6 sm:gap-8">
            <ActionButton icon="💰" label="Top Up" href="/wallet/top-up" />
            <ActionButton icon="🎁" label="Gift" href="/gift" />
            <ActionButton icon="📤" label="Transfer" href="/wallet/transfer" />
          </div>
        </div>

        {/* ─── Quick Stats ─── */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#111827] border border-white/[0.06] p-4">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">This Month</p>
              <p className="text-lg font-bold text-white">{formatCurrency(summary.monthlyUsed || 0)}</p>
              <p className="text-[11px] text-white/30">of {formatCurrency(summary.monthlyLimit || 0)} limit</p>
            </div>
            <div className="rounded-2xl bg-[#111827] border border-white/[0.06] p-4">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Transactions</p>
              <p className="text-lg font-bold text-white">{summary.transactionCount30d || 0}</p>
              <p className="text-[11px] text-white/30">in last 30 days</p>
            </div>
          </div>
        )}

        {/* ─── Recent Activity ─── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            {transactions.length > 0 && (
              <span className="text-[11px] text-white/30">{transactions.length} transactions</span>
            )}
          </div>

          {txLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#111827] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-[#111827]/50 border border-white/[0.06]">
              <span className="text-2xl block mb-3">💫</span>
              <p className="text-sm text-white/60">No activity yet</p>
              <p className="text-[11px] text-white/30 mt-1">Top up your wallet to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.slice(0, 10).map((tx) => {
                const meta = TX_ICONS[tx.type] || { icon: "•", label: tx.type.replace(/_/g, " ") };
                const isCredit = ["deposit", "refund", "transfer_in", "cashback", "bonus"].includes(tx.type);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/[0.02] transition-all"
                  >
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80">
                        {tx.description || meta.label}
                      </p>
                      <p className="text-[11px] text-white/30">{timeAgo(tx.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                        {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[11px] text-white/30">{formatCurrency(tx.balanceAfter)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
