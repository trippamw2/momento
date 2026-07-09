import { getUser, json, handleRouteError, badRequest } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

const PAYCHANGU_API = process.env.PAYCHANGU_API_URL || "https://api.paychangu.com";
const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY || "";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const { amount, recipient_name, recipient_email, sender_name, message, delivery_method, occasion, schedule_date } = body;

    if (!amount || amount < 1000) {
      return badRequest("Minimum gift card amount is 1,000 MWK");
    }
    if (!recipient_name?.trim()) {
      return badRequest("Recipient name is required");
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const admin = createAdminClient();

    // Try real PayChangu if configured
    if (PAYCHANGU_SECRET_KEY) {
      const txRef = `MOMO-GIFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const callbackUrl = `${origin}/api/payments/paychangu-webhook`;
      const returnUrl = `${origin}/gift?payment=success&tx_ref=${txRef}`;
      const cancelUrl = `${origin}/gift?payment=cancelled`;

      try {
        const paychanguRes = await fetch(`${PAYCHANGU_API}/payment/initiate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
          },
          body: JSON.stringify({
            amount,
            currency: "MWK",
            email: user.email,
            first_name: user.email?.split("@")[0] || "Guest",
            last_name: "",
            callback_url: callbackUrl,
            return_url: returnUrl,
            cancellation_url: cancelUrl,
            tx_ref: txRef,
            meta: {
              type: "gift_card",
              gift_details: {
                amount,
                recipient_name,
                recipient_email: recipient_email || null,
                sender_name: sender_name || user.email,
                message: message || null,
                delivery_method: delivery_method || "email",
                occasion: occasion || null,
                schedule_date: schedule_date || null,
              },
            },
          }),
        });

        const paychanguData = await paychanguRes.json();

        if (paychanguRes.ok && paychanguData?.data?.checkout_url) {
          await admin.from("payments").insert({
            user_id: user.id,
            amount,
            currency: "MWK",
            method: "paychangu",
            provider: "paychangu",
            provider_reference: txRef,
            status: "pending",
            metadata: { type: "gift_card", checkout_url: paychanguData.data.checkout_url },
          });

          return json({ checkout_url: paychanguData.data.checkout_url });
        }

        console.warn("PayChangu API returned no checkout_url, falling back to direct creation:", paychanguData);
      } catch (payErr) {
        console.warn("PayChangu API call failed, falling back to direct creation:", payErr);
      }
    }

    // Fallback: create the gift card directly without PayChangu
    const code = await generateUniqueCode(admin);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const status = schedule_date ? "scheduled" : "active";
    const scheduledFor = schedule_date ? new Date(schedule_date).toISOString() : null;

    const { data: giftCard, error: gcError } = await admin
      .from("gift_cards")
      .insert({
        code,
        issuer_id: user.id,
        recipient_email: recipient_email || null,
        recipient_name,
        sender_name: sender_name || user.email?.split("@")[0] || "Someone",
        message: message || null,
        amount,
        currency: "MWK",
        balance: amount,
        delivery_method: delivery_method || "email",
        occasion: occasion || null,
        status,
        schedule_date: scheduledFor,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (gcError) {
      console.error("Failed to create gift card:", gcError);
      return json({ error: "Failed to create gift card" }, 500);
    }

    await admin.from("gift_card_transactions").insert({
      gift_card_id: giftCard.id,
      type: "purchase",
      amount,
      balance_after: amount,
    });

    await admin.from("notifications").insert({
      user_id: user.id,
      type: "gift_card_purchased",
      title: "Gift card created",
      body: `Your gift card of MWK ${amount.toLocaleString()} is ready to send.`,
      data: { gift_card_id: giftCard.id, code },
    });

    return json({ code, gift_card_id: giftCard.id, status });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function generateUniqueCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let attempt = 0; attempt < 15; attempt++) {
    let code = "MOMO-";
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += "-";
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const { data: existing } = await admin
      .from("gift_cards")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) return code;
  }
  return `MOMO-${Date.now().toString(36).toUpperCase()}`;
}
