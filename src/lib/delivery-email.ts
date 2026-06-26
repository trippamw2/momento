"use client";

interface EmailCard {
  code: string;
  amount: number;
  currency: string;
  recipientName: string;
  recipientContact: string;
  senderName: string;
  message?: string;
  occasion?: string;
}

export function sendGiftViaEmail(card: EmailCard): void {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://experio.life";
  const subject = encodeURIComponent(`🎁 You've received an Experio Gift Card from ${card.senderName}!`);
  const body = encodeURIComponent(
    `Hi ${card.recipientName},\n\n` +
    `${card.senderName} has sent you an Experio Gift Card!\n` +
    (card.occasion ? `🎉 ${card.occasion}\n\n` : "\n") +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Amount: ${card.currency} ${card.amount.toLocaleString()}\n` +
    `Code: ${card.code}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    (card.message ? `"${card.message}"\n\n` : "") +
    `Redeem your gift here:\n` +
    `${origin}/gift/redeem?code=${card.code}\n\n` +
    `This gift card expires one year from the date of issue.\n\n` +
    `Live The Moment,\n` +
    `Experio`
  );
  window.open(`mailto:${card.recipientContact}?subject=${subject}&body=${body}`, "_blank");
}
