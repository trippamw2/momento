"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface BookingDetail {
  id: string;
  experience_id: string;
  guests_count: number;
  total_price: number;
  currency: string;
  status: string;
  experience_date: string;
  experience_time: string | null;
  created_at: string;
  booking_ref: string | null;
  special_requests: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  experience: {
    title: string;
    slug: string;
    location: string;
    price: number;
    currency: string;
    images: { url: string; alt: string; is_primary: boolean }[];
  } | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    refunded: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-caption font-medium border ${styles[status] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function BookingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const id = params.id as string;
  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    const token = localStorage.getItem("momento-auth-token");
    if (!token) {
      router.push("/bookings");
      return;
    }

    fetch(`/api/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Booking not found");
        return res.json();
      })
      .then((data) => {
        setBooking(data);
        // Handle payment callback
        if (paymentStatus === "success") {
          // Payment was successful — refresh to get updated status
          setTimeout(() => {
            fetch(`/api/bookings/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.ok ? r.json() : null)
              .then((d) => { if (d) setBooking(d); });
          }, 2000);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, paymentStatus, router]);

  const handlePayNow = async () => {
    const token = localStorage.getItem("momento-auth-token");
    if (!token) return;

    setPaying(true);
    setPayError("");

    try {
      const res = await fetch("/api/payments/paychangu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ booking_id: id }),
      });

      const data = await res.json();

      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setPayError(data.error || "Failed to initiate payment");
      }
    } catch {
      setPayError("Network error. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-[#05070B]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen pt-20 pb-16 flex items-center justify-center bg-[#05070B]">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-heading-lg font-bold text-[#F1F5F9] mb-2">Booking Not Found</h1>
          <p className="text-[#CBD5E1] text-body-sm mb-6">{error || "This booking doesn't exist or you don't have access."}</p>
          <Link href="/bookings" className="inline-flex px-6 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = booking.experience?.images?.find((i) => i.is_primary)?.url
    || booking.experience?.images?.[0]?.url
    || "";

  const isPending = booking.status === "pending";
  const isPaid = booking.status === "confirmed" || booking.status === "completed";

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#05070B]">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        {/* Back Link */}
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-body-sm text-[#64748B] hover:text-[#CBD5E1] transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Bookings
        </Link>

        {/* Payment Success Banner */}
        {paymentStatus === "success" && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-emerald-400">Payment Successful!</p>
              <p className="text-caption text-emerald-300/70">Your booking is now confirmed.</p>
            </div>
          </div>
        )}

        {/* Payment Cancelled Banner */}
        {paymentStatus === "cancelled" && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-yellow-400">Payment Cancelled</p>
              <p className="text-caption text-yellow-300/70">You can try again below when you&apos;re ready.</p>
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className="rounded-2xl bg-[#111827] border border-white/[0.08] overflow-hidden mb-6">
          {imageUrl && (
            <div className="relative h-48 sm:h-56">
              <Image
                src={imageUrl}
                alt={booking.experience?.title || "Experience"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-heading-xl font-bold text-[#F1F5F9]">
                  {booking.experience?.title || "Experience"}
                </h1>
                <p className="text-[#CBD5E1] text-body-sm mt-1">
                  {booking.experience?.location || ""}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <div className="flex flex-wrap gap-4 text-body-sm text-[#94A3B8]">
              <span>Ref: {booking.booking_ref || booking.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6 mb-6">
          <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-4">Booking Details</h2>
          <div className="space-y-3 text-body-sm">
            <div className="flex justify-between py-2 border-b border-white/[0.08]">
              <span className="text-[#CBD5E1]">Date</span>
              <span className="text-[#F1F5F9]">
                {new Date(booking.experience_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {booking.experience_time && (
              <div className="flex justify-between py-2 border-b border-white/[0.08]">
                <span className="text-[#CBD5E1]">Time</span>
                <span className="text-[#F1F5F9]">{booking.experience_time}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-white/[0.08]">
              <span className="text-[#CBD5E1]">Guests</span>
              <span className="text-[#F1F5F9]">{booking.guests_count}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.08]">
              <span className="text-[#CBD5E1]">Price per person</span>
              <span className="text-[#F1F5F9]">MK {booking.experience?.price?.toLocaleString() || "—"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#CBD5E1]">Total</span>
              <span className="text-heading-sm font-bold text-[#F1F5F9]">MK {booking.total_price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        {(booking.contact_phone || booking.contact_email || booking.special_requests) && (
          <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6 mb-6">
            <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-4">Contact & Requests</h2>
            <div className="space-y-3 text-body-sm">
              {booking.contact_phone && (
                <div className="flex justify-between py-2 border-b border-white/[0.08]">
                  <span className="text-[#CBD5E1]">Phone</span>
                  <span className="text-[#F1F5F9]">{booking.contact_phone}</span>
                </div>
              )}
              {booking.contact_email && (
                <div className="flex justify-between py-2 border-b border-white/[0.08]">
                  <span className="text-[#CBD5E1]">Email</span>
                  <span className="text-[#F1F5F9]">{booking.contact_email}</span>
                </div>
              )}
              {booking.special_requests && (
                <div className="py-2">
                  <span className="text-[#CBD5E1] block mb-1">Special Requests</span>
                  <p className="text-[#F1F5F9] bg-[#0A0E17] rounded-xl px-4 py-3">{booking.special_requests}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Section */}
        {isPending && (
          <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6 mb-6">
            <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-1">Complete Payment</h2>
            <p className="text-[#CBD5E1] text-body-sm mb-5">
              Your booking is pending payment. Complete your payment to confirm the experience.
            </p>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0A0E17] border border-white/[0.08] mb-5">
              <span className="text-[#CBD5E1] text-body-sm">Amount due</span>
              <span className="text-heading-md font-bold text-[#F1F5F9]">MK {booking.total_price.toLocaleString()}</span>
            </div>

            {payError && (
              <p className="text-body-sm text-[#c13515] bg-[#c13515]/8 px-3 py-2 rounded-xl mb-4">{payError}</p>
            )}

            <button
              onClick={handlePayNow}
              disabled={paying}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FFA22C] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Connecting to PayChangu...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pay Now via PayChangu
                </>
              )}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/bookings"
            className="flex-1 py-3 rounded-xl bg-[#1E293B] text-[#CBD5E1] font-semibold text-body-sm border border-white/[0.1] hover:bg-white/[0.05] transition-all text-center"
          >
            All Bookings
          </Link>
          {booking.experience?.slug && (
            <Link
              href={`/experiences/${booking.experience.slug}`}
              className="flex-1 py-3 rounded-xl bg-[#1E293B] text-[#CBD5E1] font-semibold text-body-sm border border-white/[0.1] hover:bg-white/[0.05] transition-all text-center"
            >
              View Experience
            </Link>
          )}
          {isPaid && (
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all"
            >
              Print Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
