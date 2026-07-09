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
      const txRef = `XPRO-GIFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const callbackUrl = `${origin}/api/payments/paychangu-webhook`;
      const returnUrl = `${origin}/gift?payment=success&tx_ref=${txRef}`;
      const cancelUrl = `${origin}/gift?payment=cancelled`;

      try {
        const paychanguRes = await fetch(`${PAYCHANGU_API}/payment`, {
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
            customization: {
              title: "Gift Card Purchase",
              description: `Gift card for ${recipient_name}`,
            },
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
        console.error("PayChangu API call failed:", payErr);
        return json({ error: "Payment service unavailable. Please try again later." }, 502);
      }
    }

    return json({ error: "Payment service not configured" }, 500);
  } catch (error) {
    return handleRouteError(error);
  }
}
