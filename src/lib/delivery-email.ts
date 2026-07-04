"use client";

interface EmailParams {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  amount: number;
  currency: string;
  code: string;
  message?: string;
  occasion?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

async function sendGiftCardEmail(params: EmailParams): Promise<EmailResult> {
  try {
    const token = localStorage.getItem("momento-auth-token");
    if (!token) return { success: false, error: "Not authenticated" };

    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: "gift_card",
        ...params,
      }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || "Failed to send email" };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Send a gift card via email using Brevo transactional email.
 * Falls back to mailto: link if the API call fails.
 */
export async function sendGiftViaEmail(card: {
  code: string;
  amount: number;
  currency: string;
  recipientName: string;
  recipientContact: string;
  senderName: string;
  message?: string;
  occasion?: string;
}): Promise<void> {
  const result = await sendGiftCardEmail({
    recipientEmail: card.recipientContact,
    recipientName: card.recipientName,
    senderName: card.senderName,
    amount: card.amount,
    currency: card.currency,
    code: card.code,
    message: card.message,
    occasion: card.occasion,
  });

  if (result.success) {
    return;
  }

  // Fallback: open mailto link
  console.warn("Email API failed, falling back to mailto link:", result.error);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://momento.life";
  const subject = encodeURIComponent(`You've Received a Momento Gift Card from ${card.senderName}!`);
  const body = encodeURIComponent(
    `Hi ${card.recipientName},\n\n` +
    `${card.senderName} has sent you an Momento Gift Card!\n` +
    (card.occasion ? `ðŸŽ‰ ${card.occasion}\n\n` : "\n") +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    `Amount: ${card.currency} ${card.amount.toLocaleString()}\n` +
    `Code: ${card.code}\n` +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n` +
    (card.message ? `"${card.message}"\n\n` : "") +
    `Redeem your gift here:\n` +
    `${origin}/gift/redeem?code=${card.code}\n\n` +
    `This gift card expires one year from the date of issue.\n\n` +
    `Live The Moment,\n` +
    `Momento`
  );
  window.open(`mailto:${card.recipientContact}?subject=${subject}&body=${body}`, "_blank");
}

/**
 * Send a booking confirmation email via Brevo.
 */
export async function sendBookingConfirmationEmail(params: {
  email: string;
  guestName: string;
  experienceTitle: string;
  experienceDate: string;
  experienceTime: string;
  guests: number;
  totalPrice: number;
  currency: string;
  bookingId: string;
  location: string;
  partnerName: string;
}): Promise<EmailResult> {
  try {
    const token = localStorage.getItem("momento-auth-token");
    if (!token) return { success: false, error: "Not authenticated" };

    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: "booking_confirmation", ...params }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || "Failed to send email" };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Send a booking cancellation email via Brevo.
 */
export async function sendBookingCancellationEmail(params: {
  email: string;
  guestName: string;
  experienceTitle: string;
  bookingId: string;
  refundStatus: string;
}): Promise<EmailResult> {
  try {
    const token = localStorage.getItem("momento-auth-token");
    if (!token) return { success: false, error: "Not authenticated" };

    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: "booking_cancelled", ...params }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || "Failed to send email" };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}
