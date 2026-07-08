"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getGiftCardByCode, type GiftCardFull } from "@/lib/gift-engine";
import { experiences } from "@/lib/data";

export default function GiftRedeemPage() {
  return (
    <div className="pt-20 pb-16 min-h-screen">
      <RedeemContent />
    </div>
  );
}

function RedeemContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [card, setCard] = useState<GiftCardFull | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [checked, setChecked] = useState(false);

  // Pre-fill from URL param
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setCode(codeParam.toUpperCase());
      handleCheck(codeParam.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCheck = useCallback(async (searchCode?: string) => {
    const lookupCode = searchCode || code;
    if (!lookupCode.trim()) return;

    setChecking(true);
    setNotFound(false);
    setChecked(false);

    const result = await getGiftCardByCode(lookupCode.trim());
    if (result) {
      setCard(result);
      setNotFound(false);
    } else {
      setCard(null);
      setNotFound(true);
    }
    setChecked(true);
    setChecking(false);
  }, [code]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheck();
  };

  const balancePercent = card ? Math.round(((card.amount - card.balance) / card.amount) * 100) : 0;

  const suggestedExps = experiences.slice(0, 3);

  const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    redeemed: { label: "Redeemed", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    expired: { label: "Expired", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    scheduled: { label: "Scheduled", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF0F73]/20 to-[#FF7A1A]/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
        </div>
        <h1 className="text-heading-2xl font-bold text-[#F1F5F9] mb-2">Have a Gift Card?</h1>
        <p className="text-[#CBD5E1] text-body-lg max-w-md mx-auto">
          Enter your gift card code below to check the balance and redeem toward an unforgettable experience.
        </p>
      </div>

      {/* Code Input */}
      <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6 sm:p-8 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <input
              type="text"
              placeholder="Enter code (e.g. MOMO-XXXXXXXX)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/30 transition-all font-mono tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={!code.trim() || checking}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
          >
            {checking ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Check Gift Card
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {checked && (
          <div className="mt-6">
            {notFound ? (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-body-sm font-bold text-red-400">Code Not Found</p>
                    <p className="text-caption text-red-300 mt-0.5">Please check the code and try again. Codes are format: MOMO-XXXXXXXX</p>
                  </div>
                </div>
              </div>
            ) : card ? (
              <div className="space-y-4">
                {/* Card Details */}
                <div className="p-5 rounded-2xl bg-[#1A2332] border border-white/[0.08]">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-caption text-[#64748B] mb-0.5">From</p>
                      <p className="text-body-sm font-bold text-[#F1F5F9]">{card.senderName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-caption font-medium border ${statusStyles[card.status]?.bg || ""} ${statusStyles[card.status]?.color || ""}`}>
                      {statusStyles[card.status]?.label || card.status}
                    </span>
                  </div>

                  <div className="text-center mb-5">
                    <p className="text-3xl font-bold text-[#F1F5F9]">{card.currency} {card.amount.toLocaleString()}</p>
                    {card.occasion && <p className="text-caption text-[#FF0F73] mt-1">🎉 {card.occasion}</p>}
                  </div>

                  {/* Balance Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-caption text-[#64748B]">Balance used</span>
                      <span className="text-caption text-[#CBD5E1]">{card.currency} {(card.amount - card.balance).toLocaleString()} / {card.currency} {card.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] transition-all duration-500"
                        style={{ width: `${balancePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Message */}
                  {card.message && (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                      <p className="text-caption text-[#CBD5E1] italic">"{card.message}"</p>
                    </div>
                  )}

                  {/* Code + Expiry */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <span className="text-caption font-mono text-[#64748B]">{card.code}</span>
                    <span className="text-caption text-[#64748B]">Expires: {new Date(card.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action */}
                {card.status === "active" && card.balance > 0 ? (
                  <Link
                    href="/experiences"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Browse Experiences to Redeem
                  </Link>
                ) : (
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <p className="text-body-sm text-yellow-400 font-medium">
                      {card.status === "redeemed" ? "This gift card has been fully redeemed." : "This gift card has no remaining balance."}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Suggested Experiences */}
      {suggestedExps.length > 0 && (
        <section>
          <h2 className="text-heading-md font-bold text-[#F1F5F9] mb-5">Popular Experiences to Redeem</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {suggestedExps.map((exp) => (
              <Link
                key={exp.id}
                href={`/experiences/${exp.id}`}
                className="group rounded-2xl bg-[#111827] border border-white/[0.08] overflow-hidden hover:border-white/[0.15] transition-all"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-[#1A2332]">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-transparent z-10" />
                  <div className="w-full h-full flex items-center justify-center text-[#64748B] text-caption">
                    {exp.title?.charAt(0) || "E"}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-body-sm font-bold text-[#F1F5F9] group-hover:text-[#FF0F73] transition-colors line-clamp-1">{exp.title}</h3>
                  <p className="text-caption text-[#64748B] mt-0.5 line-clamp-1">{exp.subtitle}</p>
                  <p className="text-body-sm font-bold text-[#FF0F73] mt-2">MK {exp.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How to Redeem */}
      <section className="mt-10 p-6 rounded-2xl bg-[#111827] border border-white/[0.08]">
        <h3 className="text-heading-sm font-bold text-[#F1F5F9] mb-3">How to Redeem</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Browse", desc: "Find an experience you love from our curated collection." },
            { step: "2", title: "Book", desc: "Select your date and guests, then enter your gift code at checkout." },
            { step: "3", title: "Enjoy", desc: "The amount is applied instantly. Any balance stays for next time!" },
          ].map((s) => (
            <div key={s.step} className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-full bg-[#FF0F73]/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-body-sm font-bold text-[#FF0F73]">{s.step}</span>
              </div>
              <h4 className="text-body-sm font-bold text-[#F1F5F9] mb-1">{s.title}</h4>
              <p className="text-caption text-[#64748B]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
