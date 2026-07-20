"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Experience {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  location: string;
  duration: string;
  images: { url: string; alt: string; is_primary: boolean }[];
}

type PaymentMethod = "paychangu" | "card" | "voucher" | "wallet";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "paychangu", label: "Pay Direct", desc: "PayChangu mobile money",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>,
  },
  {
    value: "card", label: "Card Payment", desc: "Credit or debit card",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><line x1="6" y1="14" x2="8" y2="14" /><line x1="10" y1="14" x2="14" y2="14" /></svg>,
  },
  {
    value: "voucher", label: "Gift Card / Voucher", desc: "Redeem a gift card",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="12" rx="2" /><path d="M12 10a2 2 0 100 4 2 2 0 000-4z" /><path d="M2 11h20" /></svg>,
  },
  {
    value: "wallet", label: "Experio Wallet", desc: "Pay with wallet balance",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 12a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const experienceId = searchParams.get("experience_id");
  const guests = parseInt(searchParams.get("guests_count") ?? "1");
  const date = searchParams.get("experience_date") ?? "";
  const time = searchParams.get("experience_time") ?? "";

  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    contact_phone: searchParams.get("contact_phone") ?? "",
    contact_email: searchParams.get("contact_email") ?? "",
    special_requests: searchParams.get("special_requests") ?? "",
    gift_card_code: searchParams.get("gift_card_code") ?? "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (searchParams.get("payment_method") as PaymentMethod) ?? "paychangu"
  );
  const [giftApplied, setGiftApplied] = useState(false);
  const [giftChecking, setGiftChecking] = useState(false);
  const [giftAmount, setGiftAmount] = useState(0);
  const [giftError, setGiftError] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const getToken = () => localStorage.getItem("experio-auth-token");

  useEffect(() => {
    if (!experienceId) { setLoading(false); return; }
    const fetchExp = async () => {
      try {
        const res = await fetch(`/api/experiences/${experienceId}`);
        if (res.ok) {
          const data = await res.json();
          setExperience(data);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchExp();
  }, [experienceId]);

  // Fetch wallet balance when wallet method is selected
  useEffect(() => {
    if (paymentMethod !== "wallet") return;
    const token = getToken();
    if (!token) return;
    setWalletLoading(true);
    fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.balance != null) setWalletBalance(data.balance); })
      .catch(() => { /* silent */ })
      .finally(() => setWalletLoading(false));
  }, [paymentMethod]);

  // Auto-apply gift card if provided in URL
  useEffect(() => {
    const giftCardCode = searchParams.get("gift_card_code");
    if (giftCardCode && paymentMethod === "voucher" && !giftApplied && !giftChecking) {
      setForm(prev => ({ ...prev, gift_card_code: giftCardCode }));
      // Small delay to let the form update
      setTimeout(() => {
        handleApplyGiftCard();
      }, 100);
    }
  }, [searchParams, paymentMethod, giftApplied, giftChecking]);

  const totalPrice = (experience?.price ?? 0) * guests;
  const finalPrice = Math.max(0, totalPrice - (paymentMethod === "voucher" && giftApplied ? giftAmount : 0));

  const handleApplyGiftCard = async () => {
    if (!form.gift_card_code.trim()) return;
    setGiftChecking(true);
    setGiftError("");
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(form.gift_card_code)}`, { headers });
      const data = await res.json();
      if (res.ok && data) {
        const balance = data.balance || data.amount || 0;
        if (balance <= 0) { setGiftError("This gift card has no remaining balance"); return; }
        setGiftAmount(Math.min(balance, totalPrice));
        setGiftApplied(true);
      } else {
        setGiftError(data?.error || "Invalid gift card code");
      }
    } catch {
      setGiftError("Could not verify gift card. Please try again.");
    } finally {
      setGiftChecking(false);
    }
  };

  const handlePay = useCallback(async () => {
    if (!experienceId || !experience) return;
    setSubmitting(true);
    setError("");
    try {
      const token = getToken();
      if (!token) { router.push("/"); return; }

      // Build booking payload
      const payload: Record<string, unknown> = {
        experience_id: experienceId,
        guests_count: guests,
        total_price: totalPrice,
        experience_date: date,
        experience_time: time || undefined,
        contact_phone: form.contact_phone || undefined,
        contact_email: form.contact_email || undefined,
        special_requests: form.special_requests || undefined,
      };

      // Add payment-specific params
      if (paymentMethod === "voucher" && giftApplied && form.gift_card_code) {
        payload.gift_card_code = form.gift_card_code;
      }
      if (paymentMethod === "wallet") {
        payload.pay_with_wallet = true;
      }
      if (paymentMethod === "voucher" && giftApplied && form.gift_card_code && finalPrice > 0) {
        // Gift card covers partial — pay remainder with PayChangu
        // The API validates gift card balance >= total, so if finalPrice > 0,
        // the gift card doesn't cover it all. We need split payment.
        // For simplicity: gift card covers what it can, wallet/paychangu covers rest
        // First check if wallet can cover the remainder
        if (walletBalance !== null && walletBalance >= finalPrice) {
          payload.pay_with_wallet = true;
        }
        // If no wallet or insufficient balance, PayChangu will handle remainder
        // (gift card + PayChangu not yet supported in API — send gift card and redirect)
      }

      // Create booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!bookingRes.ok) {
        const d = await bookingRes.json();
        setError(d.error || "Failed to create booking");
        setSubmitting(false);
        return;
      }

      const booking = await bookingRes.json();

      // If paid with wallet or gift card fully covered — booking is confirmed instantly
      if (booking.status === "confirmed") {
        router.push(`/bookings/${booking.id}?confirmed=true`);
        return;
      }

      // Otherwise redirect to PayChangu for payment
      const payRes = await fetch("/api/payments/paychangu", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          amount: finalPrice || totalPrice,
          currency: "MWK",
          description: `Booking: ${experience.title}`,
        }),
      });

      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.checkout_url) {
          window.location.href = payData.checkout_url;
        } else {
          router.push(`/bookings/${booking.id}`);
        }
      } else {
        router.push(`/bookings/${booking.id}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }, [experienceId, experience, guests, totalPrice, finalPrice, date, time, form, paymentMethod, giftApplied, giftAmount, walletBalance, router]);

  if (!experienceId) {
    return (
      <div className="pt-24 pb-20 text-center">
        <p className="text-[#64748B]">No experience selected.</p>
        <Link href="/discover" className="text-[#FF0F73] hover:underline mt-2 inline-block">Browse experiences</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-24 pb-20 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="pt-24 pb-20 text-center">
        <p className="text-[#64748B]">Experience not found.</p>
        <Link href="/discover" className="text-[#FF0F73] hover:underline mt-2 inline-block">Browse experiences</Link>
      </div>
    );
  }

  const primaryImage = experience.images?.find(i => i.is_primary)?.url || experience.images?.[0]?.url || "";

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-display-sm font-bold text-[#F1F5F9] mb-6">Checkout</h1>

        {/* Experience Summary */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 mb-6">
          <div className="flex gap-4">
            {primaryImage && (
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                <Image src={primaryImage} alt={experience.title} fill className="object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-heading-sm font-bold text-[#F1F5F9] truncate">{experience.title}</h2>
              <p className="text-caption text-[#64748B]">{experience.location} · {experience.duration}</p>
              <p className="text-body-sm text-[#64748B] mt-1">{date}{time ? ` at ${time}` : ""} · {guests} guest{guests > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-500/20 p-4 mb-6">
            <p className="text-body-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 mb-6">
          <h3 className="text-heading-sm font-bold text-[#F1F5F9] mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-caption text-[#64748B] font-medium mb-1 block">Phone</label>
              <input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]"
                placeholder="+265..." />
            </div>
            <div>
              <label className="text-caption text-[#64748B] font-medium mb-1 block">Email</label>
              <input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} type="email"
                className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-caption text-[#64748B] font-medium mb-1 block">Special Requests (optional)</label>
              <textarea value={form.special_requests} onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))} rows={2}
                className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73] resize-none" />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 mb-6">
          <h3 className="text-heading-sm font-bold text-[#F1F5F9] mb-4">Payment Method</h3>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setPaymentMethod(opt.value); if (opt.value !== "voucher") { setGiftApplied(false); setGiftError(""); } }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentMethod === opt.value
                    ? "border-[#FF0F73] bg-[#FF0F73]/10 text-white"
                    : "border-white/[0.08] bg-[#05070B] text-[#64748B] hover:border-white/20 hover:text-[#CBD5E1]"
                }`}
              >
                <span className="text-white/70">{opt.icon}</span>
                <p className="text-caption font-semibold mt-1">{opt.label}</p>
                <p className={`text-caption ${paymentMethod === opt.value ? "text-[#CBD5E1]" : "text-[#64748B]"}`}>{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Voucher — Gift Card Input */}
          {paymentMethod === "voucher" && (
            <div className="mt-4 p-4 rounded-xl bg-[#05070B] border border-white/[0.06]">
              <p className="text-caption font-semibold text-[#64748B] mb-2 uppercase tracking-wider">Gift Card Code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.gift_card_code}
                  onChange={e => { setForm(f => ({ ...f, gift_card_code: e.target.value.toUpperCase() })); setGiftApplied(false); setGiftError(""); }}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0A0E17] border border-white/[0.1] text-white text-caption font-mono placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] transition-all"
                  placeholder="XPRO-XXXX-XXXX"
                  disabled={giftApplied}
                />
                {giftApplied ? (
                  <button
                    onClick={() => { setGiftApplied(false); setForm(f => ({ ...f, gift_card_code: "" })); setGiftAmount(0); setGiftError(""); }}
                    className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-caption font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition-all whitespace-nowrap"
                  >
                    Applied
                  </button>
                ) : (
                  <button
                    onClick={handleApplyGiftCard}
                    disabled={!form.gift_card_code.trim() || giftChecking}
                    className="px-3 py-2 rounded-lg bg-[#FF0F73] text-white text-caption font-semibold hover:bg-[#FF0F73]/80 transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {giftChecking ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : "Apply"}
                  </button>
                )}
              </div>
              {giftError && <p className="text-caption text-red-500 mt-1.5">{giftError}</p>}
              {giftApplied && giftAmount > 0 && (
                <p className="text-caption text-emerald-400 mt-1.5">
                  Gift card discount: -MK {giftAmount.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Wallet — Balance Display */}
          {paymentMethod === "wallet" && (
            <div className="mt-4 p-4 rounded-xl bg-[#05070B] border border-white/[0.06]">
              {walletLoading ? (
                <div className="flex items-center gap-2 text-caption text-[#64748B]">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Checking wallet balance...
                </div>
              ) : walletBalance !== null ? (
                <div>
                  <p className="text-caption font-semibold text-[#64748B] mb-1">Wallet Balance</p>
                  <p className={`text-heading-sm font-bold ${walletBalance >= totalPrice ? "text-emerald-400" : "text-[#FF0F73]"}`}>
                    MK {walletBalance.toLocaleString()}
                  </p>
                  {walletBalance >= totalPrice ? (
                    <p className="text-caption text-emerald-400 mt-1">✓ Sufficient balance — instant confirmation</p>
                  ) : (
                    <p className="text-caption text-[#FF0F73] mt-1">
                      Insufficient balance (short by MK {(totalPrice - walletBalance).toLocaleString()}). 
                      Please top up or choose another payment method.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-caption text-[#64748B]">Unable to load wallet.</p>
                  <p className="text-caption text-[#64748B] mt-0.5">
                    <Link href="/wallet/top-up" className="text-[#FF0F73] hover:underline">Create a wallet</Link> to use this option.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-body-sm">
              <span className="text-[#64748B]">MK {experience.price.toLocaleString()} × {guests} guest{guests > 1 ? "s" : ""}</span>
              <span className="text-[#F1F5F9]">MK {totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-[#64748B]">Platform fee</span>
              <span className="text-[#F1F5F9]">Included</span>
            </div>
            {paymentMethod === "voucher" && giftApplied && giftAmount > 0 && (
              <div className="flex justify-between text-body-sm">
                <span className="text-emerald-400">Gift card discount</span>
                <span className="text-emerald-400">-MK {giftAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-heading-sm font-bold pt-2 border-t border-white/[0.08]">
              <span className="text-[#F1F5F9]">Total</span>
              <span className="text-[#FF0F73]">MK {finalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={submitting || (paymentMethod === "wallet" && walletBalance !== null && walletBalance < totalPrice)}
          className="w-full py-4 rounded-2xl bg-[#FF0F73] text-white font-bold text-heading-sm hover:shadow-[0_4px_24px_rgba(255,15,115,0.4)] transition-all disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Processing...
            </span>
          ) : paymentMethod === "wallet" && walletBalance !== null && walletBalance >= totalPrice ? (
            "Confirm & Pay with Wallet"
          ) : paymentMethod === "voucher" && giftApplied && finalPrice === 0 ? (
            "Redeem Gift Card"
          ) : paymentMethod === "voucher" && giftApplied ? (
            `Pay MK ${finalPrice.toLocaleString()}`
          ) : (
            `Pay MK ${finalPrice.toLocaleString()}`
          )}
        </button>

        <p className="text-caption text-[#64748B] text-center mt-3">
          {paymentMethod === "paychangu" || paymentMethod === "card"
            ? "You'll be redirected to PayChangu to complete payment"
            : paymentMethod === "voucher" && (!giftApplied || finalPrice > 0)
            ? "Remaining balance will be charged via PayChangu"
            : paymentMethod === "wallet" && walletBalance !== null && walletBalance >= totalPrice
            ? "Booking will be confirmed instantly"
            : "Secure payment via PayChangu"}
        </p>
      </div>
    </div>
  );
}
