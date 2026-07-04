import jsPDF from "jspdf";

export interface BookingPdfData {
  bookingRef: string;
  title: string;
  venue: string;
  location: string;
  dateLabel: string;
  time: string;
  guests: number;
  guestName?: string;
  price: number;
  status: string;
  qrDataUrl?: string;
}

export function generateBookingPDF(data: BookingPdfData): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const mg = 12;

  // ── Background gradient (simulated with rects) ──
  for (let y = 0; y < h; y += 0.5) {
    const t = y / h;
    const r = Math.round(5 + t * 10);
    const g = Math.round(7 + t * 10);
    const b = Math.round(11 + t * 8);
    doc.setFillColor(r, g, b);
    doc.rect(0, y, w, 0.5, "F");
  }

  // Subtle accent bar at top
  doc.setFillColor(255, 45, 122);
  doc.rect(0, 0, w, 3, "F");

  // ── Decorative circles ──
  doc.setFillColor(255, 45, 122, 0.06);
  doc.circle(w - 30, -10, 50, "F");
  doc.setFillColor(255, 122, 24, 0.04);
  doc.circle(-15, h - 30, 40, "F");

  // ── Header: Brand ──
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Momento", mg + 2, 22);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255, 0.4);
  doc.text("EXPERIENCE PASS", mg + 2, 28);

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    upcoming: [16, 185, 129],
    completed: [59, 130, 246],
    cancelled: [239, 68, 68],
    confirmed: [16, 185, 129],
  };
  const sc = statusColors[data.status] || [100, 100, 100];
  doc.setFillColor(sc[0], sc[1], sc[2]);
  doc.roundedRect(w - mg - 48, 16, 48, 10, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(data.status.toUpperCase(), w - mg - 24, 23, { align: "center" });

  // ── Separator ──
  doc.setDrawColor(255, 255, 255, 0.08);
  doc.setLineWidth(0.5);
  doc.line(mg, 34, w - mg, 34);

  // ── Title ──
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(data.title, w - mg * 2 - 50);
  doc.text(titleLines, mg + 2, 44);

  // ── Details ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 213, 225);

  const leftCol = mg + 2;
  let yPos = 56;

  const detailRow = (label: string, value: string) => {
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), leftCol, yPos);
    doc.setTextColor(200, 213, 225);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(value, leftCol, yPos + 5);
    yPos += 14;
  };

  const dateStr = data.dateLabel || data.dateLabel;
  detailRow("Date & Time", `${dateStr}${data.time ? ` · ${data.time}` : ""}`);
  detailRow("Venue", data.venue || data.location || "—");
  detailRow("Guests", `${data.guests} ${data.guests === 1 ? "guest" : "guests"}`);
  if (data.guestName) detailRow("Guest", data.guestName);

  // ── Price ──
  yPos = Math.max(yPos, 90);
  doc.setDrawColor(255, 255, 255, 0.08);
  doc.line(mg, yPos, w - mg, yPos);
  yPos += 8;

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", leftCol, yPos);

  doc.setTextColor(255, 45, 122);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(`MK ${data.price.toLocaleString()}`, leftCol, yPos + 10);

  // ── QR Code ──
  if (data.qrDataUrl) {
    try {
      doc.addImage(data.qrDataUrl, "PNG", w - mg - 42, 44, 38, 38);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.text(data.bookingRef, w - mg - 42 + 19, 88, { align: "center" });
    } catch { /* QR rendering failed */ }
  }

  // ── Booking Ref ──
  yPos = Math.max(yPos + 20, 120);
  doc.setDrawColor(255, 255, 255, 0.08);
  doc.line(mg, yPos, w - mg, yPos);
  yPos += 8;

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("BOOKING REFERENCE", leftCol, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.bookingRef, leftCol, yPos + 6);

  // ── Footer ──
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("LIVE THE MOMENT — Momento", mg + 2, h - 8);
  doc.text(`Issued ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`, w - mg - 2, h - 8, { align: "right" });

  return doc.output("blob");
}

export function downloadBookingPDF(data: BookingPdfData, filename?: string) {
  const blob = generateBookingPDF(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `booking-${data.bookingRef}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
