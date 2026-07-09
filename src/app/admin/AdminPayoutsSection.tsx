"use client";

import { useState, useEffect, useCallback } from "react";

interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_method: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  reference: string | null;
  notes: string | null;
  processed_at: string | null;
  created_at: string;
  partner: {
    business_name: string;
    user: { full_name: string | null } | null;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-900/30 text-amber-400",
  approved: "bg-blue-900/30 text-blue-400",
  processing: "bg-blue-900/30 text-blue-400",
  completed: "bg-emerald-900/30 text-emerald-400",
  rejected: "bg-red-900/30 text-red-400",
};

export default function AdminPayoutsSection() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("experio-auth-token");

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      const qs = statusFilter ? `?status=${statusFilter}&limit=50` : "?limit=50";
      const res = await fetch(`/api/admin/payouts${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
    } catch (e) {
      console.error("Failed to fetch payouts:", e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleStatusChange = async (payoutId: string, newStatus: string) => {
    setUpdatingId(payoutId);
    try {
      const token = getToken();
      if (!token) return;
      await fetch(`/api/admin/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchPayouts();
    } catch (e) {
      console.error("Failed to update payout:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: payouts.filter(p => p.status === "pending").length, icon: "⏳", color: "text-amber-400" },
          { label: "Approved", value: payouts.filter(p => p.status === "approved").length, icon: "✅", color: "text-blue-400" },
          { label: "Completed", value: payouts.filter(p => p.status === "completed").length, icon: "💰", color: "text-emerald-400" },
          { label: "Rejected", value: payouts.filter(p => p.status === "rejected").length, icon: "⛔", color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className={`text-heading-sm font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-caption text-[#64748B]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["", "pending", "approved", "processing", "completed", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-caption font-medium transition-all ${
              statusFilter === s ? "bg-[#FF0F73] text-white" : "bg-[#0F172A] text-[#94A3B8] hover:bg-[#1A2332] border border-white/[0.08]"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.08]">
                {["Partner", "Amount", "Method", "Bank Details", "Status", "Requested", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-caption text-[#64748B] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.08] hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-body-sm text-[#F1F5F9] font-medium">{p.partner?.business_name || "—"}</p>
                    <p className="text-caption text-[#64748B]">{p.partner?.user?.full_name || "—"}</p>
                  </td>
                  <td className="py-3 px-4 text-body-sm font-semibold text-[#F1F5F9]">MK {p.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-body-sm text-[#94A3B8]">{p.payout_method || "—"}</td>
                  <td className="py-3 px-4">
                    <p className="text-caption text-[#94A3B8]">{p.bank_name || "—"}</p>
                    <p className="text-caption text-[#64748B]">{p.account_number || "—"}</p>
                    <p className="text-caption text-[#64748B]">{p.account_name || "—"}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-caption font-medium capitalize ${STATUS_COLORS[p.status] || "bg-gray-800 text-gray-300"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-body-sm text-[#94A3B8]">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {p.status === "pending" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(p.id, "approved")}
                          disabled={updatingId === p.id}
                          className="px-2 py-1 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800/40 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(p.id, "rejected")}
                          disabled={updatingId === p.id}
                          className="px-2 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800/40 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {p.status === "approved" && (
                      <button
                        onClick={() => handleStatusChange(p.id, "completed")}
                        disabled={updatingId === p.id}
                        className="px-2 py-1 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-800/40 disabled:opacity-50"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {payouts.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-caption text-[#64748B]">No payout requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
