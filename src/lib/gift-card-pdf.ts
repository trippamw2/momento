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

export function generateGiftPDF(data: GiftCardPDFData, filename: string = "experio-gift-card.pdf"): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // â”€â”€ Deep luxury dark background â”€â”€
  doc.setFillColor(8, 6, 18);
  doc.rect(0, 0, w, h, "F");

  // â”€â”€ Rich gradient overlay (simulated with rectangles) â”€â”€
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const r = Math.round(8 + t * 12);
    const g = Math.round(6 + t * 8);
    const b = Math.round(18 + t * 20);
    doc.setFillColor(r, g, b);
    doc.rect(0, (h / steps) * i, w, h / steps + 1, "F");
  }

  // â”€â”€ Experio pink accent glow (top-right) â”€â”€
  doc.setFillColor(255, 15, 115, 0.06);
  doc.circle(w - 20, -5, 65, "F");
  doc.setFillColor(255, 90, 58, 0.04);
  doc.circle(-15, h + 10, 50, "F");

  // â”€â”€ Subtle diamond pattern â”€â”€
  doc.setDrawColor(255, 255, 255, 0.02);
  doc.setLineWidth(0.2);
  for (let x = 0; x < w + 20; x += 20) {
    for (let y = 0; y < h + 20; y += 20) {
      doc.line(x, y + 10, x + 10, y);
      doc.line(x + 10, y, x + 20, y + 10);
      doc.line(x + 20, y + 10, x + 10, y + 20);
      doc.line(x + 10, y + 20, x, y + 10);
    }
  }

  // â”€â”€ Top accent bar (Experio pink) â”€â”€
  doc.setFillColor(255, 15, 115);
  doc.rect(0, 0, w, 2.5, "F");
  // Secondary accent line
  doc.setFillColor(255, 15, 115, 0.3);
  doc.rect(0, 2.5, w, 0.5, "F");

  // â”€â”€ Brand Header â”€â”€
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Experio", 15, 18);

  doc.setTextColor(255, 15, 115);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("GIFT CARD", 15, 24);

  // â”€â”€ Decorative divider â”€â”€
  doc.setDrawColor(255, 15, 115, 0.2);
  doc.setLineWidth(0.4);
  doc.line(15, 28, w - 15, 28);

  // â”€â”€ Occasion badge â”€â”€
  if (data.occasion) {
    doc.setFillColor(255, 15, 115, 0.15);
    const occW = doc.getTextWidth(data.occasion.toUpperCase()) + 10;
    doc.roundedRect(15, 32, occW, 6, 3, 3, "F");
    doc.setTextColor(255, 15, 115);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text(data.occasion.toUpperCase(), 15 + occW / 2 - doc.getTextWidth(data.occasion.toUpperCase()) / 2, 36.5);
  }

  // â”€â”€ Amount â”€â”€
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  const amountLabel = `${data.currency} ${data.amount.toLocaleString()}`;
  doc.text(amountLabel, 15, 54);

  // â”€â”€ To / From â”€â”€
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("TO", 15, 66);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(data.recipientName, 15, 74);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("FROM", 80, 66);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.senderName, 80, 74);

  // â”€â”€ Message â”€â”€
  if (data.message) {
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    const msg = `"${data.message}"`;
    const maxWidth = 85;
    if (doc.getTextWidth(msg) > maxWidth) {
      const lines = doc.splitTextToSize(msg, maxWidth);
      doc.text(lines, 15, 84);
    } else {
      doc.text(msg, 15, 84);
    }
  }

  // â”€â”€ Code Pill â”€â”€
  const codePillY = data.message ? 96 : 84;
  doc.setFillColor(255, 15, 115, 0.1);
  doc.roundedRect(15, codePillY, 100, 14, 7, 7, "F");
  doc.setDrawColor(255, 15, 115, 0.2);
  doc.roundedRect(15, codePillY, 100, 14, 7, 7, "S");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("courier", "bold");
  doc.text(data.code, 20, codePillY + 10);

  // â”€â”€ QR Code (right side, prominent) â”€â”€
  if (data.qrDataUrl) {
    try {
      const qrSize = 34;
      const qrX = w - 15 - qrSize;
      const qrY = 44;

      // QR glow background
      doc.setFillColor(255, 15, 115, 0.06);
      doc.circle(qrX + qrSize / 2, qrY + qrSize / 2, qrSize / 2 + 4, "F");

      // QR white background
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 3, 3, "F");

      doc.addImage(data.qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // Code below QR
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5);
      doc.setFont("courier", "normal");
      doc.text(`Code: ${data.code}`, qrX, qrY + qrSize + 8);

      // "Scan to redeem" label
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.text("Scan to redeem", qrX + qrSize / 2 - doc.getTextWidth("Scan to redeem") / 2, qrY - 5);
    } catch {
      // QR add failed silently
    }
  }

  // â”€â”€ Bottom divider â”€â”€
  doc.setDrawColor(255, 15, 115, 0.1);
  doc.setLineWidth(0.3);
  doc.line(15, h - 18, w - 15, h - 18);

  // â”€â”€ Footer â”€â”€
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("Live The Moment", 15, h - 11);
  doc.setTextColor(255, 15, 115);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("â€” Experio", 15 + doc.getTextWidth("Live The Moment "), h - 11);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text(`Expires: ${new Date(data.expiresAt).toLocaleDateString()}`, 15, h - 5.5);

  doc.text(`Code: ${data.code}`, w - 15 - doc.getTextWidth(`Code: ${data.code}`), h - 5.5);

  // â”€â”€ Save â”€â”€
  doc.save(filename);
}

export function downloadGiftPDF(data: GiftCardPDFData): void {
  generateGiftPDF(data, `experio-gift-card-${data.code}.pdf`);
}
