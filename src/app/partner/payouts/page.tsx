"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface EarningsSummary {
  total_earned: number;
  available_balance: number;
  withdrawn: number;
  pending_payouts: number;
  recent_earnings: Array<{
    id: string;
    gross_amount: number;
    commission_amount: number;
    net_amount: number;
    status: string;
    created_at: string;
    experience: { title: string } | null;
  }>;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_method: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  reference: string | null;
  processed_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-900/30 text-amber-400",
  approved: "bg-blue-900/30 text-blue-400",
  processing: "bg-blue-900/30 text-blue-400",
  completed: "bg-emerald-900/30 text-emerald-400",
  rejected: "bg-red-900/30 text-red-400",
};

export default function PartnerPayoutsPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: "", bank_name: "", account_number: "", account_name: "", payout_method: "bank_transfer" });
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("experio-auth-token");

  const fetchData = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const [earnRes, payoutRes] = await Promise.all([
        fetch("/api/partners/earnings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/partners/payouts?limit=20", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (earnRes.ok) setEarnings(await earnRes.json());
      if (payoutRes.ok) {
        const d = await payoutRes.json();
        setPayouts(d.payouts || []);
      }
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRequestPayout = async () => {
    setError("");
    if (!form.amount || Number(form.amount) <= 0) { setError("Enter a valid amount"); return; }
    if (!form.bank_name || !form.account_number || !form.account_name) { setError("Fill in all bank details"); return; }
    if (Number(form.amount) > (earnings?.available_balance ?? 0)) { setError("Insufficient balance"); return; }

    setSubmitting(true);
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch("/api/partners/payouts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ amount: "", bank_name: "", account_number: "", account_name: "", payout_method: "bank_transfer" });
        fetchData();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to request payout");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="pt-24 pb-20 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h1 className="text-heading-xl font-bold text-[#F1F5F9] mb-3">Partner Access Required</h1>
          <Link href="/" className="px-6 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display-sm font-bold text-[#F1F5F9] mb-1">Earnings & Payouts</h1>
            <p className="text-[#64748B] text-body-lg">Track your revenue and request payouts.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={!earnings || earnings.available_balance <= 0}
            className="px-5 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50"
          >
            Request Payout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Earned", value: `MK ${(earnings?.total_earned ?? 0).toLocaleString()}`, icon: "💰", color: "text-[#F1F5F9]" },
            { label: "Available Balance", value: `MK ${(earnings?.available_balance ?? 0).toLocaleString()}`, icon: "✅", color: "text-emerald-400" },
            { label: "Pending Payouts", value: `MK ${(earnings?.pending_payouts ?? 0).toLocaleString()}`, icon: "⏳", color: "text-amber-400" },
            { label: "Withdrawn", value: `MK ${(earnings?.withdrawn ?? 0).toLocaleString()}`, icon: "📤", color: "text-blue-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
              <p className="text-caption text-[#64748B] font-medium mb-1">{stat.label}</p>
              <p className={`text-heading-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Payout History */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden mb-8">
          <div className="p-5 border-b border-white/[0.08]">
            <h2 className="text-heading-sm font-bold text-[#F1F5F9]">Payout History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-caption text-[#64748B] font-medium border-b border-white/[0.08]">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Bank</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Processed</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.08]/50 last:border-0 hover:bg-white/[0.05] transition-colors">
                    <td className="px-5 py-3.5 text-body-sm text-[#64748B]">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-body-sm font-semibold text-[#F1F5F9]">MK {p.amount.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-body-sm text-[#64748B]">{p.payout_method || "—"}</td>
                    <td className="px-5 py-3.5 text-body-sm text-[#64748B]">{p.bank_name || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium capitalize ${STATUS_COLORS[p.status] || "bg-gray-800 text-gray-300"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-body-sm text-[#64748B]">
                      {p.processed_at ? new Date(p.processed_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-caption text-[#64748B]">No payouts yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Earnings */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
          <div className="p-5 border-b border-white/[0.08]">
            <h2 className="text-heading-sm font-bold text-[#F1F5F9]">Recent Earnings</h2>
          </div>
          <div className="divide-y divide-white/[0.08]">
            {(earnings?.recent_earnings ?? []).map((e) => (
              <div key={e.id} className="p-4 hover:bg-white/[0.05] transition-colors flex items-center justify-between">
                <div>
                  <p className="text-body-sm font-medium text-[#F1F5F9]">{(e.experience as { title: string } | null)?.title || "Experience"}</p>
                  <p className="text-caption text-[#64748B]">{new Date(e.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm font-semibold text-[#F1F5F9]">MK {e.net_amount.toLocaleString()}</p>
                  <p className="text-caption text-[#64748B]">-{(e.commission_amount / e.gross_amount * 100).toFixed(0)}% fee</p>
                </div>
              </div>
            ))}
            {(earnings?.recent_earnings ?? []).length === 0 && (
              <div className="p-8 text-center text-caption text-[#64748B]">No earnings yet. Complete bookings to start earning!</div>
            )}
          </div>
        </div>

        {/* Request Payout Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-white/[0.08] p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-heading-md font-bold text-[#F1F5F9] mb-4">Request Payout</h3>
              <p className="text-body-sm text-[#64748B] mb-4">Available: <span className="text-emerald-400 font-semibold">MK {(earnings?.available_balance ?? 0).toLocaleString()}</span></p>

              {error && <p className="text-body-sm text-red-400 mb-4">{error}</p>}

              <div className="space-y-3">
                <div>
                  <label className="text-caption text-[#64748B] font-medium mb-1 block">Amount (MK)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" />
                </div>
                <div>
                  <label className="text-caption text-[#64748B] font-medium mb-1 block">Payout Method</label>
                  <select value={form.payout_method} onChange={e => setForm(f => ({ ...f, payout_method: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label className="text-caption text-[#64748B] font-medium mb-1 block">Bank Name</label>
                  <input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" />
                </div>
                <div>
                  <label className="text-caption text-[#64748B] font-medium mb-1 block">Account Number</label>
                  <input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" />
                </div>
                <div>
                  <label className="text-caption text-[#64748B] font-medium mb-1 block">Account Name</label>
                  <input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-[#F1F5F9] font-semibold text-body-sm hover:bg-white/[0.05] transition-all">
                  Cancel
                </button>
                <button onClick={handleRequestPayout} disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
