// ─── Gift Card Delivery Service ───
// Server-side only. Routes gift card delivery by channel:
//   email   → Brevo transactional email
//   whatsapp → WhatsApp Business API (or fallback log)
//   sms     → SMS gateway (or fallback log)
//   print   → No server action (handled client-side by PDF download)

import { sendGiftCardEmail } from "@/lib/brevo";

export interface GiftDeliveryParams {
  code: string;
  amount: number;
  currency: string;
  recipientName: string;
  recipientContact: string; // email address or phone number depending on method
  senderName: string;
  message?: string;
  occasion?: string;
  deliveryMethod: string;
}

export interface DeliveryResult {
  channel: string;
  success: boolean;
  detail?: string;
}

/**
 * Deliver a gift card to the recipient via the selected channel.
 * Called from the webhook after payment is confirmed and the card is created.
 */
export async function sendGiftCardDelivery(params: GiftDeliveryParams): Promise<DeliveryResult> {
  switch (params.deliveryMethod) {
    case "email":
      return sendViaEmail(params);
    case "whatsapp":
      return sendViaWhatsApp(params);
    case "sms":
      return sendViaSMS(params);
    case "print":
      return { channel: "print", success: true, detail: "Print delivery handled client-side" };
    default:
      console.warn(`Unknown delivery method: "${params.deliveryMethod}", falling back to email`);
      return sendViaEmail(params);
  }
}

async function sendViaEmail(params: GiftDeliveryParams): Promise<DeliveryResult> {
  const result = await sendGiftCardEmail({
    recipientEmail: params.recipientContact,
    recipientName: params.recipientName,
    senderName: params.senderName,
    amount: params.amount,
    currency: params.currency,
    code: params.code,
    message: params.message,
    occasion: params.occasion,
  });

  if (result.success) {
    return { channel: "email", success: true, detail: `Email sent (${result.messageId})` };
  }

  console.error("Gift card email delivery failed:", result.error);
  return { channel: "email", success: false, detail: result.error };
}

async function sendViaWhatsApp(params: GiftDeliveryParams): Promise<DeliveryResult> {
  // Check for WhatsApp Business API configuration
  const whatsappToken = process.env.WHATSAPP_API_TOKEN;
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;

  if (whatsappToken && whatsappPhoneId) {
    try {
      const phone = params.recipientContact.replace(/[\s\+\-\(\)]/g, "");
      const message =
        `🎁 *You've Received an Experio Gift Card from ${params.senderName}!*\n\n` +
        `Amount: ${params.currency} ${params.amount.toLocaleString()}\n` +
        (params.message ? `Message: "${params.message}"\n\n` : "\n") +
        `Code: *${params.code}*\n\n` +
        `Redeem here: ${process.env.NEXT_PUBLIC_APP_URL || "https://experio.life"}/gift/redeem?code=${params.code}`;

      const res = await fetch(
        `https://graph.facebook.com/v21.0/${whatsappPhoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { preview_url: true, body: message },
          }),
        }
      );

      if (res.ok) {
        return { channel: "whatsapp", success: true, detail: "WhatsApp message sent" };
      }

      const errBody = await res.text();
      console.error("WhatsApp API error:", res.status, errBody);
      return { channel: "whatsapp", success: false, detail: `WhatsApp API error: ${res.status}` };
    } catch (err) {
      console.error("WhatsApp delivery failed:", err);
      return { channel: "whatsapp", success: false, detail: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  // No WhatsApp API configured — log and return a clear warning
  console.warn(
    "WhatsApp delivery requested but WHATSAPP_API_TOKEN / WHATSAPP_PHONE_ID not configured. " +
    `Recipient ${params.recipientContact} needs manual WhatsApp send for card ${params.code}`
  );
  return {
    channel: "whatsapp",
    success: false,
    detail: "WhatsApp API not configured. The gift card code is saved — notify the recipient manually.",
  };
}

async function sendViaSMS(params: GiftDeliveryParams): Promise<DeliveryResult> {
  // Check for SMS gateway configuration (Twilio-style)
  const smsAccountSid = process.env.SMS_ACCOUNT_SID;
  const smsAuthToken = process.env.SMS_AUTH_TOKEN;
  const smsFrom = process.env.SMS_FROM_NUMBER;

  if (smsAccountSid && smsAuthToken && smsFrom) {
    try {
      const phone = params.recipientContact.replace(/[\s\+\-\(\)]/g, "");
      const message =
        `Experio Gift Card from ${params.senderName}! ` +
        `Amount: ${params.currency} ${params.amount.toLocaleString()}. ` +
        `Code: ${params.code}. Redeem: ${process.env.NEXT_PUBLIC_APP_URL || "https://experio.life"}/gift/redeem?code=${params.code}`;

      // Twilio-style API
      const auth = btoa(`${smsAccountSid}:${smsAuthToken}`);
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${smsAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: phone.startsWith("+") ? phone : `+${phone}`,
            From: smsFrom,
            Body: message,
          }),
        }
      );

      if (res.ok) {
        return { channel: "sms", success: true, detail: "SMS sent via Twilio" };
      }

      const errBody = await res.text();
      console.error("SMS gateway error:", res.status, errBody);
      return { channel: "sms", success: false, detail: `SMS gateway error: ${res.status}` };
    } catch (err) {
      console.error("SMS delivery failed:", err);
      return { channel: "sms", success: false, detail: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  // No SMS gateway configured — log and return warning
  console.warn(
    "SMS delivery requested but SMS_ACCOUNT_SID / SMS_AUTH_TOKEN / SMS_FROM_NUMBER not configured. " +
    `Recipient ${params.recipientContact} needs manual SMS send for card ${params.code}`
  );
  return {
    channel: "sms",
    success: false,
    detail: "SMS gateway not configured. The gift card code is saved — notify the recipient manually.",
  };
}
