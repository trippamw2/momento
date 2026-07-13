import jsPDF from "jspdf";
import { GIFT_CARD_VARIANTS, type GiftCardVariant } from "@/components/GiftCard";

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
  /** Variant id from GIFT_CARD_VARIANTS (defaults to "signature") */
  variantId?: string;
}

/** Parse hex color to RGB tuple for jsPDF */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

export function generateGiftPDF(data: GiftCardPDFData, filename: string = "experio-gift-card.pdf"): void {
  // Resolve the variant
  const variant = GIFT_CARD_VARIANTS.find((v) => v.id === (data.variantId || "signature")) || GIFT_CARD_VARIANTS[4];
  const cv = variant.canvas;
  const [fromR, fromG, fromB] = hexToRgb(cv.from);
  const [viaR, viaG, viaB] = hexToRgb(cv.via);
  const [toR, toG, toB] = hexToRgb(cv.to);
  const [accentR, accentG, accentB] = hexToRgb(cv.accent);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // ── Gradient background (variant themed) ──
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const r = Math.round(fromR + (toR - fromR) * t);
    const g = Math.round(fromG + (toG - fromG) * t);
    const b = Math.round(fromB + (toB - fromB) * t);
    doc.setFillColor(r, g, b);
    doc.rect(0, (h / steps) * i, w, h / steps + 1, "F");
  }

  // ── Decorative circles using accent ──
  doc.setFillColor(accentR, accentG, accentB, 0.08);
  doc.circle(w - 30, -10, 60, "F");
  doc.setFillColor(accentR, accentG, accentB, 0.05);
  doc.circle(-20, h + 10, 50, "F");

  // ── Top accent line ──
  doc.setFillColor(accentR, accentG, accentB);
  doc.rect(0, 0, w, 3, "F");

  // Determine text colors based on variant
  const textPrimary = cv.lightText ? [255, 255, 255] as const : [30, 41, 59] as const;
  const textSecondary = cv.lightText ? [148, 163, 184] as const : [100, 116, 139] as const;
  const textMuted = cv.lightText ? [100, 116, 139] as const : [71, 85, 105] as const;
  const dividerColor = cv.lightText ? 255 : 0;
  const dividerOpacity = cv.lightText ? 0.08 : 0.15;

  // ── Brand ──
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Experio", 15, 20);

  doc.setTextColor(accentR, accentG, accentB);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("GIFT CARD", 15, 26);

  // ── Decorative divider ──
  doc.setDrawColor(dividerColor, dividerColor, dividerColor, dividerOpacity);
  doc.setLineWidth(0.5);
  doc.line(15, 32, w - 15, 32);

  // ── Occasion badge ──
  if (data.occasion) {
    doc.setFillColor(accentR, accentG, accentB, 0.15);
    doc.roundedRect(15, 37, doc.getTextWidth(data.occasion) + 8, 6, 3, 3, "F");
    doc.setTextColor(accentR, accentG, accentB);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(data.occasion, 19, 42);
  }

  // ── Amount ──
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const amountLabel = `${data.currency} ${data.amount.toLocaleString()}`;
  doc.text(amountLabel, 15, 58);

  // ── To / From ──
  doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("TO", 15, 70);
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.recipientName, 15, 78);

  doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("FROM", 80, 70);
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.senderName, 80, 78);

  // ── Message ──
  if (data.message) {
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
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

  // ── Code badge ──
  const codeBgColor = cv.lightText ? [17, 24, 39] as const : [241, 245, 249] as const;
  doc.setFillColor(codeBgColor[0], codeBgColor[1], codeBgColor[2]);
  doc.roundedRect(15, 98, 100, 14, 4, 4, "F");
  doc.setDrawColor(dividerColor, dividerColor, dividerColor, dividerOpacity);
  doc.roundedRect(15, 98, 100, 14, 4, 4, "S");
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  doc.setFontSize(9);
  doc.setFont("courier", "bold");
  doc.text(data.code, 20, 108);

  // ── QR Code ──
  if (data.qrDataUrl) {
    try {
      const qrSize = 28;
      doc.addImage(data.qrDataUrl, "PNG", w - 15 - qrSize, 40, qrSize, qrSize);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.setFontSize(5);
      doc.setFont("courier", "normal");
      doc.text(data.code, w - 15 - qrSize, 75);
    } catch {
      // QR add failed silently
    }
  }

  // ── Bottom divider ──
  doc.setDrawColor(dividerColor, dividerColor, dividerColor, dividerOpacity);
  doc.setLineWidth(0.3);
  doc.line(15, h - 20, w - 15, h - 20);

  // ── Footer ──
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Live The Moment — Experio", 15, h - 12);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFontSize(5);
  doc.text(`Expires: ${new Date(data.expiresAt).toLocaleDateString()}`, 15, h - 7);

  doc.text(`Code: ${data.code}`, w - 15 - doc.getTextWidth(`Code: ${data.code}`), h - 7);

  // ── Save ──
  doc.save(filename);
}

export function downloadGiftPDF(data: GiftCardPDFData): void {
  generateGiftPDF(data, `experio-gift-card-${data.code}.pdf`);
}
