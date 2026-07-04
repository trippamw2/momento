"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { getBookingCountdown } from "@/lib/booking-engine";
import { downloadBookingPDF } from "@/lib/booking-card-pdf";

interface BookingData {
  id: string;
  title: string;
  date: string;
  dateLabel: string;
  time: string;
  guests: number;
  status: "upcoming" | "completed" | "cancelled";
  price: number;
  location: string;
  image: string;
  bookingRef: string;
}

interface BookingCardProps {
  booking: BookingData;
  showActions?: boolean;
  onCancel?: () => void;
}

export default function BookingCard({ booking, showActions = true, onCancel }: BookingCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showQRVerification, setShowQRVerification] = useState(false);
  const [countdown, setCountdown] = useState<ReturnType<typeof getBookingCountdown> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL(booking.bookingRef, {
      width: 150,
      margin: 1,
      color: { dark: "#1a1a2e", light: "#ffffff" },
    }).then(setQrDataUrl).catch((err) => console.error("QR code generation failed:", err));
  }, [booking.bookingRef]);

  // Live countdown for upcoming bookings
  useEffect(() => {
    if (booking.status !== "upcoming") return;
    const update = () => setCountdown(getBookingCountdown(booking.date));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [booking.status, booking.date]);

  const statusColors: Record<string, string> = {
    upcoming: "bg-emerald-500",
    completed: "bg-blue-500",
    cancelled: "bg-red-500",
  };

  const handleDownloadPNG = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = cardRef.current.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      // Draw card background
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#0f0f1a");
      gradient.addColorStop(0.5, "#1a1a2e");
      gradient.addColorStop(1, "#16213e");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, rect.width, rect.height, 16);
      ctx.fill();

      // Draw decorative circles
      ctx.fillStyle = "rgba(255, 15, 115, 0.08)";
      ctx.beginPath();
      ctx.arc(rect.width - 60, -30, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(159, 59, 255, 0.06)";
      ctx.beginPath();
      ctx.arc(-20, rect.height - 40, 100, 0, Math.PI * 2);
      ctx.fill();

      // Status badge
      const statusColors_draw: Record<string, string> = {
        upcoming: "#10b981",
        completed: "#3b82f6",
        cancelled: "#ef4444",
      };
      const statusBg = statusColors_draw[booking.status] || "#6b7280";

      // Draw status
      ctx.fillStyle = statusBg;
      ctx.beginPath();
      ctx.roundRect(20, 20, 100, 26, 13);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(booking.status.toUpperCase(), 70, 37);

      // Draw "BOOKING CONFIRMATION" label
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("BOOKING CONFIRMATION", 20, 65);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(booking.title, 20, 88);

      // Draw details
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "12px sans-serif";
      ctx.fillText(`${booking.dateLabel} · ${booking.guests} guest${booking.guests > 1 ? "s" : ""}`, 20, 112);
      ctx.fillText(booking.location, 20, 130);

      // Draw QR code
      if (qrDataUrl) {
        const qrImg = new window.Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, rect.width - 160, 20, 80, 80);
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(booking.bookingRef, rect.width - 120, 115);
        };
        qrImg.src = qrDataUrl;
      }

      // Price
      ctx.fillStyle = "#FF0F73";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`MK ${booking.price.toLocaleString()}`, rect.width - 20, 88);

      // Divider
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 148);
      ctx.lineTo(rect.width - 20, 148);
      ctx.stroke();

      // Footer
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Momento — Live The Experience", 20, rect.height - 10);

      const link = document.createElement("a");
      link.download = `booking-${booking.bookingRef}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (e) { console.warn("Failed to download booking card:", e); }
  }, [booking, qrDataUrl]);

  const handleDownloadPDF = useCallback(() => {
    downloadBookingPDF({
      bookingRef: booking.bookingRef,
      title: booking.title,
      venue: booking.location,
      location: booking.location,
      dateLabel: booking.dateLabel,
      time: booking.time,
      guests: booking.guests,
      price: booking.price,
      status: booking.status,
      qrDataUrl,
    }, `booking-${booking.bookingRef}.pdf`);
  }, [booking, qrDataUrl]);

  const handleCancelConfirm = useCallback(() => {
    setCancelled(true);
    setShowCancelConfirm(false);
    onCancel?.();
  }, [onCancel]);

  const actualStatus = cancelled ? "cancelled" : booking.status;

  return (
    <div className="group">
      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-[#111827] rounded-2xl border border-white/[0.1] p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <h3 className="text-heading-md font-bold text-white text-center mb-2">Cancel Booking?</h3>
            <p className="text-[#CBD5E1] text-body-sm text-center mb-6">This action cannot be undone. Your booking will be permanently cancelled.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.1] text-white text-body-sm font-medium hover:bg-white/5 transition-all">
                Keep Booking
              </button>
              <button onClick={handleCancelConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-body-sm font-semibold hover:bg-red-600 transition-all">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Verification Modal */}
      {showQRVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setShowQRVerification(false)}>
          <div className="bg-[#111827] rounded-3xl border border-white/[0.1] p-8 max-w-sm mx-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-heading-md font-bold text-white mb-1">Verification QR</h3>
            <p className="text-caption text-[#94A3B8] mb-6">Present this code at check-in</p>
            {qrDataUrl && (
              <div className="mb-6 p-4 rounded-2xl bg-white inline-block shadow-lg">
                <Image src={qrDataUrl} alt="Verification QR" width={200} height={200} className="mx-auto" />
              </div>
            )}
            <div className="space-y-1 mb-6">
              <p className="text-body-sm font-semibold text-white">{booking.title}</p>
              <p className="text-caption text-[#94A3B8]">{booking.dateLabel} · {booking.time}</p>
              <p className="text-caption text-[#64748B] font-mono">{booking.bookingRef}</p>
            </div>
            <button
              onClick={() => setShowQRVerification(false)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white text-body-sm font-medium hover:bg-white/20 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Luxury Ticket Card */}
      <div
        ref={cardRef}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] border border-white/[0.08] shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] ${actualStatus === "cancelled" ? "opacity-70" : ""}`}
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF0F73]/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#FF0F73]/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.03)_0%,transparent_60%)]" />

        {/* Perforation line (left side ticket stub effect) */}
        <div className="absolute left-20 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent hidden sm:block" />
        <div className="absolute left-20 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-ambient-warm hidden sm:block" />

        <div className="relative z-10 p-5 sm:p-6">
          {/* Top row: status + brand */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusColors[actualStatus] || "bg-gray-500"} animate-pulse`} />
              <span className="text-caption font-semibold text-white/60 uppercase tracking-wider">{actualStatus}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Momento</p>
              <p className="text-[8px] text-white/10">EXPERIENCE PASS</p>
            </div>
          </div>

          {/* Countdown for upcoming */}
          {actualStatus === "upcoming" && countdown && !countdown.expired && (
            <div className="mb-3 flex items-center gap-3 text-caption">
              <span className="text-white/40 uppercase tracking-wider text-[10px]">Starts in</span>
              <div className="flex gap-2">
                {countdown.days > 0 && <CountdownUnit value={countdown.days} label="d" />}
                <CountdownUnit value={countdown.hours} label="h" />
                <CountdownUnit value={countdown.minutes} label="m" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Left: Main content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-heading-md font-bold text-white mb-1 leading-tight line-clamp-1">
                {booking.title}
              </h3>

              {/* Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body-sm text-white/60 mb-4">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {booking.dateLabel}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {booking.time || "Flexible"}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
                  {booking.guests} guest{booking.guests > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {booking.location}
                </span>
              </div>

              {/* Booking ref + QR row */}
              <div className="flex items-center gap-3 sm:hidden">
                {qrDataUrl && (
                  <div className="flex-shrink-0">
                    <Image src={qrDataUrl} alt="QR Code" width={64} height={64} className="rounded-lg bg-white p-1" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Booking Ref</p>
                  <p className="text-body-sm font-mono font-bold text-white/80">{booking.bookingRef}</p>
                </div>
              </div>
            </div>

            {/* Right: Price + QR (desktop) */}
            <div className="hidden sm:flex flex-col items-end gap-3">
              <p className="text-heading-lg font-bold text-[#FF0F73]">MK {booking.price.toLocaleString()}</p>
              {qrDataUrl && (
                <div className="flex flex-col items-center gap-1">
                  <Image src={qrDataUrl} alt="QR Code" width={80} height={80} className="rounded-lg bg-white p-1.5 shadow-lg" />
                  <p className="text-[8px] text-white/20 font-mono">{booking.bookingRef}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile price */}
          <div className="sm:hidden mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-caption text-white/40">Total</p>
            <p className="text-heading-sm font-bold text-[#FF0F73]">MK {booking.price.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && !cancelled && (
        <div className="flex items-center gap-2 mt-3">
          {booking.status === "upcoming" && (
            <>
              <Link
                href={`/experiences/${booking.id}`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white text-body-sm font-semibold text-center hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all duration-300"
              >
                View Details
              </Link>
              <button
                onClick={() => setShowQRVerification(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium hover:bg-white/20 transition-all"
                title="Show QR for verification"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              </button>
              <button
                onClick={handleDownloadPNG}
                className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium hover:bg-white/20 transition-all"
                title="Download PNG"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium hover:bg-white/20 transition-all"
                title="Download PDF"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </button>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-body-sm font-medium hover:bg-red-500/20 transition-all"
              >
                Cancel
              </button>
            </>
          )}
          {booking.status === "completed" && (
            <>
              <button
                onClick={handleDownloadPNG}
                className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download Pass (PNG)
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Download Pass (PDF)
              </button>
              <Link
                href={`/experiences/${booking.id}`}
                className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium hover:bg-white/20 transition-all text-center"
              >
                Rebook
              </Link>
            </>
          )}
          {booking.status === "cancelled" && (
            <Link
              href={`/experiences/${booking.id}`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium text-center hover:bg-white/20 transition-all"
            >
              Book Again
            </Link>
          )}
        </div>
      )}

      {/* Cancelled confirmation message */}
      {cancelled && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-body-sm text-center">
          Booking cancelled. <Link href={`/experiences/${booking.id}`} className="underline font-medium">Book again?</Link>
        </div>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-white font-bold text-body-sm">{value.toString().padStart(2, "0")}</span>
      <span className="text-white/40 text-[10px] uppercase">{label}</span>
    </div>
  );
}
