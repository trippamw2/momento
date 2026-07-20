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

function BronzeIcon() { return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="#CD7F32"><circle cx="10" cy="10" r="8"/><path d="M10 4l1.5 4.5H16l-3.5 2.5 1.5 4.5L10 13l-4 2.5 1.5-4.5L4 8.5h4.5z" fill="rgba(255,255,255,0.3)"/></svg>; }
function SilverIcon() { return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="#C0C0C0"><circle cx="10" cy="10" r="8"/><path d="M10 4l1.5 4.5H16l-3.5 2.5 1.5 4.5L10 13l-4 2.5 1.5-4.5L4 8.5h4.5z" fill="rgba(255,255,255,0.3)"/></svg>; }
function GoldIcon() { return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="#FFD700"><circle cx="10" cy="10" r="8"/><path d="M10 4l1.5 4.5H16l-3.5 2.5 1.5 4.5L10 13l-4 2.5 1.5-4.5L4 8.5h4.5z" fill="rgba(255,255,255,0.3)"/></svg>; }
function PlatinumIcon() { return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="#00BFFF"><path d="M10 2L8 8H2l5 4-2 6 5-4 5 4-2-6 5-4h-6z"/></svg>; }

const TIER_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; minPoints: number }> = {
  bronze: { label: "Bronze", icon: <BronzeIcon />, color: "from-amber-700 to-amber-500", minPoints: 0 },
  silver: { label: "Silver", icon: <SilverIcon />, color: "from-slate-400 to-slate-300", minPoints: 500 },
  gold: { label: "Gold", icon: <GoldIcon />, color: "from-yellow-500 to-yellow-300", minPoints: 2000 },
  platinum: { label: "Platinum", icon: <PlatinumIcon />, color: "from-cyan-400 to-blue-400", minPoints: 5000 },
};

// ─── Transaction SVG Icons ───

function TxIconDeposit() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 12a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M12 3v4m0 0l-2-2m2 2l2-2" /></svg>; }
function TxIconWithdrawal() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 5v14m0 0l-2-2m2 2l2-2" /><circle cx="12" cy="12" r="9" /></svg>; }
function TxIconPayment() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M9 5v10m6-10v10" /><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>; }
function TxIconRefund() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M7 16l-4-4m0 0l4-4m-4 4h18" /><path d="M17 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2" /></svg>; }
function TxIconTransferIn() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 5v14m0 0l-3-3m3 3l3-3" /><path d="M5 12h14" /></svg>; }
function TxIconTransferOut() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 19V5m0 0l-3 3m3-3l3 3" /><path d="M19 12H5" /></svg>; }
function TxIconCashback() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 2l2.5 6.5L21 9l-5 4.5 1.5 6.5L12 16l-5.5 3.5L8 13.5 3 9l6.5-.5z" /></svg>; }
function TxIconBonus() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="12" rx="2" /><path d="M12 10a2 2 0 100 4 2 2 0 000-4z" /><path d="M2 11h20" /></svg>; }
function TxIconFee() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><path d="M14 2v6h6" /><path d="M12 18v-6m-3 3h6" /></svg>; }
function TxIconAdjustment() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 4v5h5" /><path d="M20 20v-5h-5" /><path d="M4 9a9 9 0 0115.36-5.36" /><path d="M20 15a9 9 0 01-15.36 5.36" /></svg>; }
function TxIconGiftCard() { return <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="12" rx="2" /><path d="M12 11v6" /><path d="M9 14h6" /></svg>; }

const TX_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  deposit: { icon: <TxIconDeposit />, label: "Top Up" },
  withdrawal: { icon: <TxIconWithdrawal />, label: "Withdrawal" },
  payment: { icon: <TxIconPayment />, label: "Booking" },
  refund: { icon: <TxIconRefund />, label: "Refund" },
  transfer_in: { icon: <TxIconTransferIn />, label: "Transfer In" },
  transfer_out: { icon: <TxIconTransferOut />, label: "Transfer Out" },
  cashback: { icon: <TxIconCashback />, label: "Cashback" },
  bonus: { icon: <TxIconBonus />, label: "Bonus" },
  fee: { icon: <TxIconFee />, label: "Fee" },
  adjustment: { icon: <TxIconAdjustment />, label: "Adjustment" },
  gift_card_redemption: { icon: <TxIconGiftCard />, label: "Gift Card" },
};

// ─── Action Button ───

function ActionButton({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300 active:scale-95">
        {icon}
      </div>
      <span className="text-[11px] text-white/50 group-hover:text-white/70 font-medium transition-colors">{label}</span>
    </Link>
  );
}

function WalletIcon() { return <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 12a2 2 0 11-4 0 2 2 0 014 0z" /></svg>; }
function GiftIcon() { return <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="12" rx="2" /><path d="M12 10a2 2 0 100 4 2 2 0 000-4z" /><path d="M2 11h20" /></svg>; }
function SendIcon() { return <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>; }

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
            <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 12a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
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
                <span className="shrink-0">{tier.icon}</span>
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
            <ActionButton icon={<WalletIcon />} label="Top Up" href="/wallet/top-up" />
            <ActionButton icon={<GiftIcon />} label="Gift" href="/gift" />
            <ActionButton icon={<SendIcon />} label="Transfer" href="/wallet/transfer" />
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
              <svg className="w-8 h-8 mx-auto mb-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.5 6.5L21 9l-5 4.5 1.5 6.5L12 16l-5.5 3.5L8 13.5 3 9l6.5-.5z" /></svg>
              <p className="text-sm text-white/60">No activity yet</p>
              <p className="text-[11px] text-white/30 mt-1">Top up your wallet to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.slice(0, 10).map((tx) => {
                const meta = TX_ICONS[tx.type] || { icon: <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="3" /></svg>, label: tx.type.replace(/_/g, " ") };
                const isCredit = ["deposit", "refund", "transfer_in", "cashback", "bonus"].includes(tx.type);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/[0.02] transition-all"
                  >
                    <span className="shrink-0">{meta.icon}</span>
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
