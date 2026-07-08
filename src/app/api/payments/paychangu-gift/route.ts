import { getUser, json, handleRouteError, badRequest } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

const PAYCHANGU_API = process.env.PAYCHANGU_API_URL || "https://api.paychangu.com";
const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY || "";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const { amount, recipient_name, recipient_email, sender_name, message, delivery_method, occasion, design, schedule_date } = body;

    if (!amount || amount < 1000) {
      return badRequest("Minimum gift card amount is 1,000 MWK");
    }
    if (!recipient_name?.trim()) {
      return badRequest("Recipient name is required");
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Generate a tx_ref that identifies this as a gift card payment
    const txRef = `MOMO-GIFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const callbackUrl = `${origin}/api/payments/paychangu-webhook`;
    const returnUrl = `${origin}/gift?payment=success&tx_ref=${txRef}`;
    const cancelUrl = `${origin}/gift?payment=cancelled`;

    // Store gift card details as metadata — the gift card will be created on webhook confirmation
    const giftMetadata = {
      type: "gift_card",
      gift_details: {
        amount,
        recipient_name,
        recipient_email: recipient_email || null,
        sender_name: sender_name || user.email,
        message: message || null,
        delivery_method: delivery_method || "email",
        occasion: occasion || null,
        design: design || null,
        schedule_date: schedule_date || null,
      },
    };

    if (PAYCHANGU_SECRET_KEY) {
      // Real PayChangu API integration
      const payload = {
        amount,
        currency: "MWK",
        email: user.email,
        first_name: user.email?.split("@")[0] || "Guest",
        last_name: "",
        callback_url: callbackUrl,
        return_url: returnUrl,
        cancellation_url: cancelUrl,
        tx_ref: txRef,
        meta: giftMetadata,
      };

      const paychanguRes = await fetch(`${PAYCHANGU_API}/payment/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const paychanguData = await paychanguRes.json();

      if (!paychanguRes.ok || !paychanguData?.data?.checkout_url) {
        console.error("PayChangu error:", paychanguData);
        return json({ error: "Payment service error. Please try again." }, 502);
      }

      // Record the payment
      const admin = createAdminClient();
      await admin.from("payments").insert({
        user_id: user.id,
        amount,
        currency: "MWK",
        method: "paychangu",
        provider: "paychangu",
        provider_reference: txRef,
        status: "pending",
        metadata: {
          ...giftMetadata,
          checkout_url: paychanguData.data.checkout_url,
        },
      });

      return json({ checkout_url: paychanguData.data.checkout_url });
    }

    // Fallback: simulate PayChangu checkout for development
    const admin = createAdminClient();
    await admin.from("payments").insert({
      user_id: user.id,
      amount,
      currency: "MWK",
      method: "paychangu",
      provider: "paychangu",
      provider_reference: txRef,
      status: "pending",
      metadata: {
        ...giftMetadata,
        checkout_url: returnUrl,
      },
    });

    // In dev fallback, we redirect to the return URL directly which simulates a webhook call
    return json({ checkout_url: `${origin}/gift?payment=initiated&tx_ref=${txRef}` });
  } catch (error) {
    return handleRouteError(error);
  }
}
