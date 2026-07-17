"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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

const TX_ICONS: Record<string, { icon: string; color: string }> = {
  deposit: { icon: "↓", color: "text-green-400" },
  withdrawal: { icon: "↑", color: "text-red-400" },
  payment: { icon: "↑", color: "text-red-400" },
  refund: { icon: "↻", color: "text-green-400" },
  transfer_in: { icon: "←", color: "text-blue-400" },
  transfer_out: { icon: "→", color: "text-orange-400" },
  cashback: { icon: "$", color: "text-green-400" },
  bonus: { icon: "+", color: "text-yellow-400" },
  fee: { icon: "✕", color: "text-red-400" },
  adjustment: { icon: "±", color: "text-purple-400" },
  gift_card_redemption: { icon: "◇", color: "text-pink-400" },
};

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

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("experio-auth-token");
}

export default function WalletPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [txLoading, setTxLoading] = useState(true);
  const [txPage, setTxPage] = useState(0);

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

  useEffect(() => {
    fetchSummary();
    fetchTransactions(0);
  }, [fetchSummary, fetchTransactions]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-0">
        <div className="h-48 bg-[#111827] rounded-2xl" />
        <div className="h-24 bg-[#111827] rounded-2xl" />
        <div className="h-64 bg-[#111827] rounded-2xl" />
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#111827] flex items-center justify-center">
          <svg className="w-6 h-6 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <p className="text-[#CBD5E1] mb-4">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  const dailyPercent = summary ? Math.min(100, (summary.dailyUsed / summary.dailyLimit) * 100) : 0;
  const monthlyPercent = summary ? Math.min(100, (summary.monthlyUsed / summary.monthlyLimit) * 100) : 0;

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#05070B]">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-heading-xl font-bold text-[#F1F5F9]">Wallet</h1>
          <p className="text-body-sm text-[#CBD5E1] mt-1">Manage your balance, transfers, and transactions.</p>
        </div>
        <div className="space-y-6">
          {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#FF0F73]/15 to-[#111827] border border-[#FF0F73]/20 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-body-sm text-[#64748B] mb-1">Available Balance</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9] break-all sm:break-normal">
              {formatCurrency(summary?.balance || 0)}
            </h1>
            <p className="text-caption text-[#64748B] mt-1">{summary?.currency || "MWK"}</p>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-caption font-medium ${
            summary?.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
            summary?.status === "frozen" ? "bg-yellow-500/20 text-yellow-400" :
            "bg-red-500/20 text-red-400"
          }`}>
            {summary?.status || "unknown"}
          </span>
        </div>

        {/* Daily/Monthly usage */}
        <div className="space-y-3 mt-6">
          <div>
            <div className="flex justify-between text-caption text-[#64748B] mb-1">
              <span>Daily Usage</span>
              <span>{formatCurrency(summary?.dailyUsed || 0)} / {formatCurrency(summary?.dailyLimit || 0)}</span>
            </div>
            <div className="h-1.5 bg-[#1A2332] rounded-full overflow-hidden">
              <div className="h-full bg-[#FF0F73] rounded-full transition-all" style={{ width: `${dailyPercent}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-caption text-[#64748B] mb-1">
              <span>Monthly Usage</span>
              <span>{formatCurrency(summary?.monthlyUsed || 0)} / {formatCurrency(summary?.monthlyLimit || 0)}</span>
            </div>
            <div className="h-1.5 bg-[#1A2332] rounded-full overflow-hidden">
              <div className="h-full bg-[#FF7A1A] rounded-full transition-all" style={{ width: `${monthlyPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty Summary */}
      <LoyaltySummary />

      {/* Transaction History */}
      <div>
        <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-4">Transaction History</h2>
        {txLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[#111827] rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-[#111827]/50 rounded-xl border border-white/[0.06]">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1A2332] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <p className="text-body-sm text-[#CBD5E1]">No transactions yet</p>
            <p className="text-caption text-[#64748B] mt-1">Top up your wallet to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const meta = TX_ICONS[tx.type] || { icon: "•", color: "text-[#64748B]" };
              const isCredit = ["deposit", "refund", "transfer_in", "cashback", "bonus"].includes(tx.type);
              return (
                <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#111827]/50 border border-white/[0.06] hover:bg-[#111827] transition-all">
                  <div className={`w-10 h-10 rounded-full bg-[#1A2332] flex items-center justify-center text-lg ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-[#F1F5F9] capitalize">
                      {tx.description || tx.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-caption text-[#64748B]">{timeAgo(tx.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-body-sm font-semibold ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-caption text-[#64748B]">{formatCurrency(tx.balanceAfter)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
    </div>
  );
}

// ─── Loyalty Summary Mini Card ───

function LoyaltySummary() {
  const [loyalty, setLoyalty] = useState<{
    points: number;
    tier: string;
    tierProgress: number;
    nextTier: string | null;
  } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/loyalty", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setLoyalty(data);
      })
      .catch(() => {});
  }, []);

  if (!loyalty) return null;

  return (
    <div className="bg-gradient-to-r from-[#FF0F73]/10 to-[#111827] border border-[#FF0F73]/20 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1A2332] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <div>
            <p className="text-body-sm font-semibold text-[#F1F5F9] capitalize">{loyalty.tier}</p>
            <p className="text-caption text-[#64748B]">{loyalty.points.toLocaleString()} points</p>
          </div>
        </div>
        {loyalty.nextTier && (
          <span className="text-caption text-[#64748B] sm:text-right">
            Next: {loyalty.nextTier} ({loyalty.tierProgress.toFixed(0)}%)
          </span>
        )}
      </div>
      {loyalty.nextTier && (
        <div className="h-1.5 bg-[#1A2332] rounded-full overflow-hidden mt-3">
          <div className="h-full bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] rounded-full transition-all" style={{ width: `${loyalty.tierProgress}%` }} />
        </div>
      )}
    </div>
  );
}
