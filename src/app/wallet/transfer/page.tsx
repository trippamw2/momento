"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TransferPage() {
  const router = useRouter();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ amount: number; email: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseInt(amount.replace(/[^0-9]/g, ""));
    if (!recipientEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!numAmount || numAmount < 100) {
      setError("Minimum transfer is 100 MWK");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("experio-auth-token") : null;
    if (!token) {
      setError("Please sign in");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          amount: numAmount,
          note: note || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");

      setResult({ amount: numAmount, email: recipientEmail });
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success && result) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <p className="text-5xl">✅</p>
        <h2 className="text-heading-lg font-bold text-[#F1F5F9]">Transfer Sent!</h2>
        <p className="text-body-sm text-[#64748B]">
          MK {result.amount.toLocaleString()} sent to {result.email}
        </p>
        <button
          onClick={() => router.push("/wallet")}
          className="px-6 py-2 bg-[#FFA22C] text-[#05070B] rounded-lg font-medium hover:bg-[#FFA22C]/90 transition-all"
        >
          Back to Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-heading-lg font-bold text-[#F1F5F9]">Send Money</h1>
        <p className="text-body-sm text-[#64748B] mt-1">Transfer funds to another Momento user</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Recipient Email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-4 py-3 bg-[#111827] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#FFA22C]/50 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Amount (MWK)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] font-medium">MK</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="w-full pl-12 pr-4 py-3 bg-[#111827] border border-white/[0.08] rounded-xl text-white text-lg font-medium focus:outline-none focus:border-[#FFA22C]/50 transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's this for?"
            maxLength={100}
            className="w-full px-4 py-3 bg-[#111827] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#FFA22C]/50 transition-colors"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-body-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#FFA22C] text-[#05070B] rounded-xl font-semibold hover:bg-[#FFA22C]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Processing..." : "Send Money"}
        </button>
      </form>

      <div className="p-4 bg-[#111827]/50 rounded-xl border border-white/[0.06]">
        <p className="text-caption text-[#64748B]">
          <span className="text-yellow-400">⚠️</span> Transfers are instant and cannot be reversed. 
          Double-check the recipient email before sending.
        </p>
      </div>
    </div>
  );
}
