import jsPDF from "jspdf";

export interface GiftCardPDFData {
  recipientName: string;
  senderName: string;
  amount: number;
  currency: string;
  code: string;
  message?: string;
  occasion?: string;
  qrDataUrl?: string;
  expiresAt: string;
}

export function generateGiftPDF(data: GiftCardPDFData, filename: string = "momento-gift-card.pdf"): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // â”€â”€ Dark background â”€â”€
  doc.setFillColor(5, 7, 11);
  doc.rect(0, 0, w, h, "F");

  // â”€â”€ Gradient overlay (simulated with rectangles) â”€â”€
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const r = Math.round(5 + t * 10);
    const g = Math.round(7 + t * 10);
    const b = Math.round(11 + t * 15);
    doc.setFillColor(r, g, b);
    doc.rect(0, (h / steps) * i, w, h / steps + 1, "F");
  }

  // â”€â”€ Decorative circles â”€â”€
  doc.setFillColor(255, 45, 122, 0.06);
  doc.circle(w - 30, -10, 60, "F");
  doc.setFillColor(255, 122, 24, 0.04);
  doc.circle(-20, h + 10, 50, "F");

  // â”€â”€ Top accent line â”€â”€
  doc.setFillColor(255, 45, 122);
  doc.rect(0, 0, w, 3, "F");

  // â”€â”€ Brand â”€â”€
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Momento", 15, 20);

  doc.setTextColor(255, 45, 122);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("GIFT CARD", 15, 26);

  // â”€â”€ Decorative divider â”€â”€
  doc.setDrawColor(255, 255, 255, 0.08);
  doc.setLineWidth(0.5);
  doc.line(15, 32, w - 15, 32);

  // â”€â”€ Occasion badge â”€â”€
  if (data.occasion) {
    doc.setFillColor(255, 45, 122, 0.15);
    doc.roundedRect(15, 37, doc.getTextWidth(data.occasion) + 8, 6, 3, 3, "F");
    doc.setTextColor(255, 45, 122);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(data.occasion, 19, 42);
  }

  // â”€â”€ Amount â”€â”€
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const amountLabel = `${data.currency} ${data.amount.toLocaleString()}`;
  doc.text(amountLabel, 15, 58);

  // â”€â”€ To / From â”€â”€
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("TO", 15, 70);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.recipientName, 15, 78);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("FROM", 80, 70);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.senderName, 80, 78);

  // â”€â”€ Message â”€â”€
  if (data.message) {
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    const msg = `"${data.message}"`;
    const maxWidth = 85;
    if (doc.getTextWidth(msg) > maxWidth) {
      const lines = doc.splitTextToSize(msg, maxWidth);
      doc.text(lines, 15, 90);
    } else {
      doc.text(msg, 15, 90);
    }
  }

  // â”€â”€ Code â”€â”€
  doc.setFillColor(17, 24, 39);
  doc.roundedRect(15, 98, 100, 14, 4, 4, "F");
  doc.setDrawColor(255, 255, 255, 0.08);
  doc.roundedRect(15, 98, 100, 14, 4, 4, "S");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("courier", "bold");
  doc.text(data.code, 20, 108);

  // â”€â”€ QR Code â”€â”€
  if (data.qrDataUrl) {
    try {
      const qrSize = 28;
      doc.addImage(data.qrDataUrl, "PNG", w - 15 - qrSize, 40, qrSize, qrSize);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5);
      doc.setFont("courier", "normal");
      doc.text(data.code, w - 15 - qrSize, 75);
    } catch {
      // QR add failed silently
    }
  }

  // â”€â”€ Bottom divider â”€â”€
  doc.setDrawColor(255, 255, 255, 0.06);
  doc.setLineWidth(0.3);
  doc.line(15, h - 20, w - 15, h - 20);

  // â”€â”€ Footer â”€â”€
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Live The Moment â€” Momento", 15, h - 12);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(5);
  doc.text(`Expires: ${new Date(data.expiresAt).toLocaleDateString()}`, 15, h - 7);

  doc.text(`Code: ${data.code}`, w - 15 - doc.getTextWidth(`Code: ${data.code}`), h - 7);

  // â”€â”€ Save â”€â”€
  doc.save(filename);
}

export function downloadGiftPDF(data: GiftCardPDFData): void {
  generateGiftPDF(data, `momento-gift-card-${data.code}.pdf`);
}
