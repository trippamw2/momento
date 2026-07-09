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
          Gift Cards
        </div>
        <h2 className="text-heading-xl font-bold text-[#F1F5F9] mb-2">Track &amp; Redeem</h2>
        <p className="text-[#CBD5E1] text-body-lg max-w-lg mx-auto">
          Received a gift card? Enter the code below to check its status and redeem it toward an experience.
        </p>
      </div>

      <div className="bg-[#111827] rounded-3xl border border-white/[0.08] p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter gift card code (e.g. XPRO-XXXXXXXX)"
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
                Check Status
              </>
            )}
          </button>
        </div>

        {trackResult && (
          <div className={`p-5 rounded-2xl border mb-6 transition-all ${
            trackResult.found
              ? "bg-gradient-to-br from-emerald-500/8 to-emerald-400/5 border-emerald-500/20"
              : "bg-gradient-to-br from-red-500/8 to-red-400/5 border-red-500/20"
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
                  {trackResult.found ? "âœ¨ Gift Card Found!" : "Code Not Found"}
                </p>
                <p className={`text-caption mt-0.5 ${trackResult.found ? "text-emerald-300" : "text-red-300"}`}>
                  {trackResult.found
                    ? `Status: ${trackResult.status === "active" ? "Active" : trackResult.status} Â· Value: ${trackResult.value}`
                    : "Please check the code and try again. Codes are format: XPRO-XXXXXXXX"}
                </p>
                {trackResult.found && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                      trackResult.status === "active"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : trackResult.status === "redeemed"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    }`}>
                      {trackResult.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#FF0F73]/5 to-[#FF7A1A]/5 border border-white/[0.08]">
          <div className="flex items-start gap-3">
            <p className="text-caption text-[#CBD5E1] leading-relaxed">
              <strong className="text-[#F1F5F9]">To redeem:</strong> When booking an experience, enter your gift card code at checkout to apply the value toward your purchase. Unused balance remains for future bookings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
