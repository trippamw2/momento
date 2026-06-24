"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

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
}

export default function BookingCard({ booking, showActions = true }: BookingCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL(booking.bookingRef, {
      width: 150,
      margin: 1,
      color: { dark: "#1a1a2e", light: "#ffffff" },
    }).then(setQrDataUrl).catch(() => {});
  }, [booking.bookingRef]);

  const statusColors: Record<string, string> = {
    upcoming: "bg-emerald-500",
    completed: "bg-blue-500",
    cancelled: "bg-red-500",
  };

  const handleDownload = useCallback(async () => {
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
      ctx.fillStyle = "rgba(255, 56, 92, 0.08)";
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
          // Draw reference below QR
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(booking.bookingRef, rect.width - 120, 115);
        };
        qrImg.src = qrDataUrl;
      }

      // Price
      ctx.fillStyle = "#DD2A7B";
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
      ctx.fillText("EXPERIO — Live The Experience", 20, rect.height - 10);

      const link = document.createElement("a");
      link.download = `booking-${booking.bookingRef}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch {}
  }, [booking, qrDataUrl]);

  return (
    <div className="group">
      {/* Luxury Ticket Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] border border-white/[0.08] shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#DD2A7B]/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#8134AF]/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.03)_0%,transparent_60%)]" />

        {/* Perforation line (left side ticket stub effect) */}
        <div className="absolute left-20 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent hidden sm:block" />
        <div className="absolute left-20 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-ambient-warm hidden sm:block" />

        <div className="relative z-10 p-5 sm:p-6">
          {/* Top row: status + brand */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusColors[booking.status] || "bg-gray-500"} animate-pulse`} />
              <span className="text-caption font-semibold text-white/60 uppercase tracking-wider">{booking.status}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Experio</p>
              <p className="text-[8px] text-white/10">EXPERIENCE PASS</p>
            </div>
          </div>

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
              <p className="text-heading-lg font-bold text-[#DD2A7B]">MK {booking.price.toLocaleString()}</p>
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
            <p className="text-heading-sm font-bold text-[#DD2A7B]">MK {booking.price.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 mt-3">
          {booking.status === "upcoming" && (
            <>
              <Link
                href={`/experiences/${booking.id}`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#F58529] text-white text-body-sm font-semibold text-center hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300"
              >
                View Details
              </Link>
              <button
                onClick={handleDownload}
                className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium hover:bg-white/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
            </>
          )}
          {booking.status === "completed" && (
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download Pass
            </button>
          )}
          {booking.status === "cancelled" && (
            <Link
              href="/experiences"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/[0.08] text-white/80 text-body-sm font-medium text-center hover:bg-white/20 transition-all"
            >
              Book Again
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
