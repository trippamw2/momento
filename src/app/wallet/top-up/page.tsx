"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AMOUNT_PRESETS = [10000, 25000, 50000, 100000, 200000, 500000];

export default function TopUpPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePreset = (val: number) => {
    setAmount(val);
    setCustomAmount("");
    setError("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(val);
    setAmount(val ? parseInt(val) : 0);
    setError("");
  };

  const handleSubmit = async () => {
    if (amount < 1000) {
      setError("Minimum deposit is 1,000 MWK");
      return;
    }
    setLoading(true);
    setError("");

    const token = typeof window !== "undefined" ? localStorage.getItem("experio-auth-token") : null;
    if (!token) {
      setError("Please sign in");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          redirect_url: `${window.location.origin}/wallet?deposit=success`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        router.push("/wallet?deposit=pending");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-heading-lg font-bold text-[#F1F5F9]">Top Up Wallet</h1>
        <p className="text-body-sm text-[#64748B] mt-1">Add funds to your Momento wallet via mobile money</p>
      </div>

      {/* Amount Presets */}
      <div>
        <p className="text-body-sm font-medium text-[#CBD5E1] mb-3">Quick Amounts</p>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNT_PRESETS.map((val) => (
            <button
              key={val}
              onClick={() => handlePreset(val)}
              className={`p-3 rounded-xl text-body-sm font-medium transition-colors ${
                amount === val
                  ? "bg-[#FFA22C] text-[#05070B] border border-[#FFA22C]"
                  : "bg-[#111827] text-[#CBD5E1] border border-white/[0.08] hover:border-[#FFA22C]/50"
              }`}
            >
              MK {val.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <p className="text-body-sm font-medium text-[#CBD5E1] mb-2">Or Enter Amount</p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] font-medium">MK</span>
          <input
            type="text"
            inputMode="numeric"
            value={customAmount}
            onChange={handleCustomChange}
            placeholder="0"
            className="w-full pl-12 pr-4 py-3 bg-[#111827] border border-white/[0.08] rounded-xl text-white text-lg font-medium focus:outline-none focus:border-[#FFA22C]/50 transition-colors"
          />
        </div>
      </div>

      {/* Summary */}
      {amount > 0 && (
        <div className="bg-[#111827]/50 rounded-xl p-4 space-y-2 border border-white/[0.06]">
          <div className="flex justify-between text-body-sm">
            <span className="text-[#64748B]">Amount</span>
            <span className="text-white font-medium">MK {amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-[#64748B]">Fee</span>
            <span className="text-green-400">Free</span>
          </div>
          <div className="border-t border-white/[0.08] pt-2 flex justify-between">
            <span className="text-[#CBD5E1] font-medium">You&apos;ll receive</span>
            <span className="text-[#FFA22C] font-bold">MK {amount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-body-sm text-red-400">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={amount < 1000 || loading}
        className="w-full py-3 bg-[#FFA22C] text-[#05070B] rounded-xl font-semibold hover:bg-[#FFA22C]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Processing..." : `Top Up MK ${amount.toLocaleString()}`}
      </button>

      <p className="text-caption text-[#64748B] text-center">
        Powered by PayChangu. Funds are credited instantly after successful payment.
      </p>
    </div>
  );
}
