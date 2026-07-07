"use client";

import { useState } from "react";

export default function TrackRedeem() {
  const [trackCode, setTrackCode] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<{ found: boolean; value?: string; status?: string } | null>(null);

  const handleTrackCode = async () => {
    if (!trackCode.trim()) return;
    setTracking(true);
    try {
      const token = localStorage.getItem("experio-auth-token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(trackCode)}`, { headers });
      const data = await res.json();
      if (res.ok && data) {
        setTrackResult({ found: true, value: `MK ${(data.amount || data.balance || 0).toLocaleString()}`, status: data.status || "active" });
      } else {
        setTrackResult({ found: false, value: data?.error });
      }
    } catch {
      setTrackResult({ found: false });
    } finally {
      setTracking(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto" id="redeem">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF0F73]/10 to-[#FF7A1A]/10 border border-[#FF0F73]/20 text-[#FF0F73] text-caption font-semibold mb-4">
          <span>🎯</span> Gift Cards
        </div>
        <h2 className="text-heading-xl font-bold text-[#F1F5F9] mb-2">Track &amp; Redeem</h2>
        <p className="text-[#CBD5E1] text-body-lg max-w-lg mx-auto">
          Received a gift card? Enter the code below to check its status and redeem it toward an experience.
        </p>
      </div>

      <div className="bg-[#111827] rounded-3xl border border-white/[0.08] p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <input
              type="text"
              placeholder="Enter gift card code (e.g. MOMO-XXXXXXXX)"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/20 transition-all font-mono tracking-wider"
            />
          </div>
          <button
            onClick={handleTrackCode}
            disabled={!trackCode.trim() || tracking}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
          >
            {tracking ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Check Status
              </>
            )}
          </button>
        </div>

        {trackResult && (
          <div className={`p-5 rounded-2xl border mb-6 transition-all ${
            trackResult.found
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                trackResult.found ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}>
                {trackResult.found ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-body-sm font-bold ${trackResult.found ? "text-emerald-400" : "text-red-400"}`}>
                  {trackResult.found ? "Gift Card Found!" : "Code Not Found"}
                </p>
                <p className={`text-caption mt-0.5 ${trackResult.found ? "text-emerald-300" : "text-red-300"}`}>
                  {trackResult.found
                    ? `This card is ${trackResult.status} · ${trackResult.value}`
                    : "Please check the code and try again. Codes are format: MOMO-XXXXXXXX"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-2">
          <p className="text-caption font-semibold text-[#CBD5E1] mb-3 uppercase tracking-wider">Status Timeline</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { step: "Purchased", icon: "🛒", done: true, desc: "Card issued" },
              { step: "Delivered", icon: "📨", done: true, desc: "Sent to recipient" },
              { step: "Viewed", icon: "👀", done: trackResult?.found, desc: "Code checked" },
              { step: "Redeemed", icon: "✅", done: trackResult?.status === "redeemed", desc: "Experience booked" },
            ].map((s) => (
              <div key={s.step} className={`text-center p-4 rounded-2xl transition-all border ${
                s.done
                  ? "bg-[#111827] border-emerald-500/20 shadow-sm"
                  : "bg-white/[0.03] border-white/[0.06]"
              }`}>
                <span className={`text-2xl block mb-2 ${s.done ? "" : "opacity-30 grayscale"}`}>{s.icon}</span>
                <p className={`text-caption font-bold ${s.done ? "text-[#F1F5F9]" : "text-[#64748B]"}`}>{s.step}</p>
                <p className={`text-caption mt-0.5 ${s.done ? "text-emerald-400" : "text-[#64748B]"}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#FF0F73]/5 to-[#FF7A1A]/5 border border-white/[0.08]">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#FF0F73] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-caption text-[#CBD5E1] leading-relaxed">
              <strong className="text-[#F1F5F9]">To redeem:</strong> When booking an experience, enter your gift card code at checkout to apply the value toward your purchase. Unused balance remains for future bookings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
