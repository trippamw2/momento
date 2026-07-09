"use client";

// ─── Types ───

export interface GiftCardCreate {
  amount: number;
  recipientName: string;
  recipientContact: string;
  senderName: string;
  message?: string;
  deliveryMethod: "whatsapp" | "email" | "sms" | "print";
  scheduleDate?: string;
  occasion?: string;
  design?: string;
}

export interface GiftCardFull {
  id: string;
  code: string;
  amount: number;
  balance: number;
  currency: string;
  recipientName: string;
  recipientContact: string;
  senderName: string;
  message?: string;
  deliveryMethod: string;
  scheduleDate?: string;
  occasion?: string;
  design?: string;
  status: "active" | "redeemed" | "expired" | "scheduled";
  createdAt: string;
  expiresAt: string;
}

// ─── Helpers ───

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("experio-auth-token");
}

/** Map a DB gift card row to the GiftCardFull shape used by UI */
function mapGiftCard(row: Record<string, unknown>): GiftCardFull {
  return {
    id: String(row.id),
    code: String(row.code),
    amount: Number(row.amount),
    balance: Number(row.balance),
    currency: String(row.currency || "MWK"),
    recipientName: String(row.recipient_name || ""),
    recipientContact: String(row.recipient_email || row.recipient_phone || ""),
    senderName: String(row.sender_name || ""),
    message: row.message ? String(row.message) : undefined,
    deliveryMethod: String(row.delivery_method || "email"),
    scheduleDate: row.schedule_date ? String(row.schedule_date) : undefined,
    occasion: row.occasion ? String(row.occasion) : undefined,
    design: row.design ? String(row.design) : undefined,
    status: String(row.status) as GiftCardFull["status"],
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
  };
}

// ─── Delivery helpers (WhatsApp/SMS still use browser) ───

export function sendGiftCard(card: GiftCardFull): void {
  if (card.deliveryMethod === "whatsapp") {
    sendViaWhatsApp(card);
  } else if (card.deliveryMethod === "sms") {
    sendViaSMS(card);
  }
  // "email" is handled server-side by Brevo in the webhook
  // "print" is handled by PDF download in the UI
}

function sendViaWhatsApp(card: GiftCardFull): void {
  const message = encodeURIComponent(
    `🎁 You've Received a Experio Gift Card from ${card.senderName}!\n\n` +
    `Amount: ${card.currency} ${card.amount.toLocaleString()}\n` +
    (card.message ? `Message: "${card.message}"\n\n` : "\n") +
    `Code: ${card.code}\n\n` +
    `Redeem at: ${window.location.origin}/gift/redeem?code=${card.code}`
  );
  const phone = card.recipientContact.replace(/[\s\+\-]/g, "");
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

function sendViaSMS(card: GiftCardFull): void {
  const message = encodeURIComponent(
    `🎁 Experio Gift Card from ${card.senderName}! Code: ${card.code}. Redeem: ${window.location.origin}/gift/redeem?code=${card.code}`
  );
  window.open(`sms:${card.recipientContact}?body=${message}`, "_blank");
}

// ─── API Functions ───

/**
 * Check a gift card by code via the real API.
 * Returns the mapped GiftCardFull or null if not found.
 */
export async function getGiftCardByCode(code: string): Promise<GiftCardFull | null> {
  try {
    const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.giftCard ? mapGiftCard(data.giftCard) : null;
  } catch {
    return null;
  }
}

/**
 * Get all gift cards sent by the authenticated user via the real API.
 */
export async function getSentGiftCards(): Promise<GiftCardFull[]> {
  const token = getToken();
  if (!token) return [];

  try {
    const res = await fetch("/api/gift-cards?limit=50", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.giftCards || []).map(mapGiftCard);
  } catch {
    return [];
  }
}

/**
 * Cancel a scheduled gift card.
 * NOTE: There is no cancel API endpoint yet, so this returns false.
 * The UI should handle this gracefully.
 */
export async function cancelScheduledGift(giftId: string): Promise<boolean> {
  // TODO: Create a cancel API endpoint if scheduled gifts are implemented
  return false;
}
