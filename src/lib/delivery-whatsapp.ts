"use client";

interface WhatsAppCard {
  code: string;
  amount: number;
  currency: string;
  recipientName: string;
  senderName: string;
  message?: string;
}

export function sendGiftViaWhatsApp(card: WhatsAppCard): void {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://momento.life";
  const text = encodeURIComponent(
    `🎁 You've Received a Momento Gift Card!\n\n` +
    `From: ${card.senderName}\n` +
    `Amount: ${card.currency} ${card.amount.toLocaleString()}\n` +
    (card.message ? `Message: "${card.message}"\n\n` : "\n") +
    `Code: ${card.code}\n\n` +
    `Redeem here: ${origin}/gift/redeem?code=${card.code}\n\n` +
    `Live The Moment ✨`
  );
  window.open(`https://wa.me/?text=${text}`, "_blank");
}
