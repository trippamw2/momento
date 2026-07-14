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
    contact_phone: "",
    contact_email: "",
    special_requests: "",
    gift_card_code: "",
  });

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

  const totalPrice = (experience?.price ?? 0) * guests;

  const handlePay = useCallback(async () => {
    if (!experienceId || !experience) return;
    setSubmitting(true);
    setError("");
    try {
      const token = getToken();
      if (!token) { router.push("/"); return; }

      // Create booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          experience_id: experienceId,
          guests_count: guests,
          total_price: totalPrice,
          experience_date: date,
          experience_time: time || undefined,
          contact_phone: form.contact_phone || undefined,
          contact_email: form.contact_email || undefined,
          special_requests: form.special_requests || undefined,
          gift_card_code: form.gift_card_code || undefined,
        }),
      });

      if (!bookingRes.ok) {
        const d = await bookingRes.json();
        setError(d.error || "Failed to create booking");
        setSubmitting(false);
        return;
      }

      const booking = await bookingRes.json();

      // Initiate payment
      const payRes = await fetch("/api/payments/paychangu", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          amount: totalPrice,
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
  }, [experienceId, experience, guests, totalPrice, date, time, form, router]);

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

        {/* Gift Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 mb-6">
          <h3 className="text-heading-sm font-bold text-[#F1F5F9] mb-3">Gift Card (optional)</h3>
          <input value={form.gift_card_code} onChange={e => setForm(f => ({ ...f, gift_card_code: e.target.value.toUpperCase() }))}
            className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm font-mono focus:outline-none focus:border-[#FF0F73]"
            placeholder="XPRO-XXXX-XXXX" />
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
            <div className="flex justify-between text-heading-sm font-bold pt-2 border-t border-white/[0.08]">
              <span className="text-[#F1F5F9]">Total</span>
              <span className="text-[#FF0F73]">MK {totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button onClick={handlePay} disabled={submitting}
          className="w-full py-4 rounded-2xl bg-[#FF0F73] text-white font-bold text-heading-sm hover:shadow-[0_4px_24px_rgba(255,15,115,0.4)] transition-all disabled:opacity-50">
          {submitting ? "Processing..." : `Pay MK ${totalPrice.toLocaleString()}`}
        </button>

        <p className="text-caption text-[#64748B] text-center mt-3">
          You&apos;ll be redirected to PayChangu to complete payment
        </p>
      </div>
    </div>
  );
}
