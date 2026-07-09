"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSentGiftCards, cancelScheduledGift, type GiftCardFull } from "@/lib/gift-engine";
import { sendGiftViaWhatsApp } from "@/lib/delivery-whatsapp";
import { sendGiftViaEmail } from "@/lib/delivery-email";
import { downloadGiftPDF } from "@/lib/gift-card-pdf";

type FilterTab = "all" | "active" | "scheduled" | "redeemed" | "expired";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  scheduled: { label: "Scheduled", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  redeemed: { label: "Redeemed", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  expired: { label: "Expired", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "scheduled", label: "Scheduled" },
  { key: "redeemed", label: "Redeemed" },
];

export default function GiftTrackingPage() {
  const [gifts, setGifts] = useState<GiftCardFull[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSentGiftCards().then((cards) => {
      setGifts(cards);
      setLoading(false);
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCancelScheduled = useCallback(async (giftId: string) => {
    const ok = await cancelScheduledGift(giftId);
    if (ok) {
      setGifts((prev) => prev.filter((g) => g.id !== giftId));
      showToast("Scheduled gift cancelled");
    } else {
      showToast("Could not cancel â€” feature not yet supported");
    }
    setConfirmCancel(null);
  }, [showToast]);

  const handleResend = useCallback((gift: GiftCardFull) => {
    if (gift.deliveryMethod === "whatsapp") {
      sendGiftViaWhatsApp(gift);
    } else if (gift.deliveryMethod === "email") {
      sendGiftViaEmail({ ...gift, recipientContact: gift.recipientContact });
    }
    showToast(`Opening ${gift.deliveryMethod}...`);
  }, [showToast]);

  const handleDownloadPDF = useCallback((gift: GiftCardFull) => {
    downloadGiftPDF({
      recipientName: gift.recipientName,
      senderName: gift.senderName,
      amount: gift.amount,
      currency: gift.currency,
      code: gift.code,
      message: gift.message,
      occasion: gift.occasion,
      expiresAt: gift.expiresAt,
    });
  }, []);

  const filtered = filter === "all" ? gifts : gifts.filter((g) => g.status === filter);

  if (loading) {
    return (
      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-heading-xl font-bold text-[#F1F5F9]">Sent Gifts</h1>
            <p className="text-[#CBD5E1] text-body-sm mt-0.5">
              {gifts.length} gift{gifts.length !== 1 ? "s" : ""} sent
            </p>
          </div>
          <Link
            href="/gift"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all"
          >
            Send New Gift
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.06] border border-white/[0.08] w-fit mb-6">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all ${
                filter === tab.key
                  ? "bg-[#111827] text-[#F1F5F9] shadow-sm"
                  : "text-[#64748B] hover:text-[#CBD5E1]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cancel Confirmation Modal */}
        {confirmCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmCancel(null)}>
            <div className="bg-[#111827] rounded-2xl border border-white/[0.1] p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="text-heading-md font-bold text-white text-center mb-2">Cancel Scheduled Gift?</h3>
              <p className="text-[#CBD5E1] text-body-sm text-center mb-6">This will permanently remove the scheduled delivery.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmCancel(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.1] text-white text-body-sm font-medium hover:bg-white/5 transition-all">
                  Keep
                </button>
                <button onClick={() => handleCancelScheduled(confirmCancel)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-body-sm font-semibold hover:bg-red-600 transition-all">
                  Cancel Gift
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#111827] border border-white/[0.1] text-[#F1F5F9] text-body-sm shadow-xl animate-in fade-in slide-in-from-bottom-2">
            {toast}
          </div>
        )}

        {/* Gift List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <h2 className="text-heading-md font-bold text-[#F1F5F9] mb-2">
              {filter === "all" ? "No gifts sent yet" : `No ${filter} gifts`}
            </h2>
            <p className="text-[#CBD5E1] text-body-sm mb-6 max-w-sm mx-auto">
              {filter === "all" ? "Send your first gift card to someone special." : `No gifts with "${filter}" status.`}
            </p>
            {filter === "all" && (
              <Link
                href="/gift"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm"
              >
                Send a Gift
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((gift) => {
              const cfg = statusConfig[gift.status] || statusConfig.active;
              const createdDate = new Date(gift.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const scheduleDate = gift.scheduleDate ? new Date(gift.scheduleDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

              return (
                <div key={gift.id} className="rounded-2xl bg-[#111827] border border-white/[0.08] p-5 sm:p-6 transition-all hover:border-white/[0.12]">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF0F73]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-body-sm font-bold text-[#F1F5F9]">To: {gift.recipientName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <p className="text-caption text-[#64748B]">
                          {createdDate}
                          {scheduleDate && ` Â· Scheduled: ${scheduleDate}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-heading-sm font-bold text-[#FF0F73]">{gift.currency} {gift.amount.toLocaleString()}</p>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div>
                      <p className="text-[10px] text-[#64748B] uppercase tracking-wider">From</p>
                      <p className="text-caption font-medium text-[#CBD5E1]">{gift.senderName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Contact</p>
                      <p className="text-caption font-medium text-[#CBD5E1] truncate">{gift.recipientContact}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Delivery</p>
                      <p className="text-caption font-medium text-[#CBD5E1] capitalize">{gift.deliveryMethod}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Balance</p>
                      <p className="text-caption font-medium text-[#CBD5E1]">{gift.currency} {gift.balance.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Occasion + Message */}
                  {(gift.occasion || gift.message) && (
                    <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      {gift.occasion && <p className="text-caption text-[#FF0F73] font-medium">{gift.occasion}</p>}
                      {gift.message && <p className="text-caption text-[#CBD5E1] italic mt-1">"{gift.message}"</p>}
                    </div>
                  )}

                  {/* Status Timeline */}
                  <div className="flex items-center gap-1 mb-4 px-1">
                    {[
                      { key: "purchased", label: "Sent", done: true },
                      { key: "delivered", label: "Delivered", done: gift.status !== "scheduled" },
                      { key: "viewed", label: "Viewed", done: gift.status === "redeemed" || gift.balance < gift.amount },
                      { key: "redeemed", label: "Redeemed", done: gift.status === "redeemed" },
                    ].map((step, i, arr) => (
                      <div key={step.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-[#64748B]"}`}>
                            {step.done ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <span className="text-[10px] font-bold">{i + 1}</span>}
                          </div>
                          <span className={`text-[9px] mt-1 ${step.done ? "text-emerald-400" : "text-[#64748B]"}`}>{step.label}</span>
                        </div>
                        {i < arr.length - 1 && (
                          <div className={`flex-1 h-px mx-1 mt-[-16px] ${step.done ? "bg-emerald-500/30" : "bg-white/[0.06]"}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.06]">
                    {(gift.status === "active") && (
                      <>
                        <button onClick={() => handleResend(gift)} className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[#CBD5E1] text-caption font-medium hover:bg-white/[0.1] transition-all flex items-center gap-1.5">
                          Resend {gift.deliveryMethod === "whatsapp" ? "WhatsApp" : "Email"}
                        </button>
                        <button onClick={() => handleDownloadPDF(gift)} className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[#CBD5E1] text-caption font-medium hover:bg-white/[0.1] transition-all flex items-center gap-1.5">
                          Download PDF
                        </button>
                      </>
                    )}
                    {gift.status === "scheduled" && (
                      <button onClick={() => setConfirmCancel(gift.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-caption font-medium hover:bg-red-500/20 transition-all flex items-center gap-1.5">
                        Cancel Schedule
                      </button>
                    )}
                    {gift.status === "redeemed" && (
                      <button onClick={() => handleDownloadPDF(gift)} className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[#CBD5E1] text-caption font-medium hover:bg-white/[0.1] transition-all flex items-center gap-1.5">
                        Download Receipt
                      </button>
                    )}
                    <span className="ml-auto text-[10px] text-[#64748B] font-mono">{gift.code}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
