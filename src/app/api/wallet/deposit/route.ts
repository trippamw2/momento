import { getUser, json, handleRouteError, parseBody, badRequest } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY || "";
const PAYCHANGU_API = process.env.PAYCHANGU_API_URL || "https://api.paychangu.com";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ amount: number; redirect_url?: string }>(request);

    if (!body.amount || body.amount < 1000) {
      return badRequest("Minimum deposit amount is 1,000 MWK");
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const admin = createAdminClient();
    const txRef = `XPRO-WAL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    if (PAYCHANGU_SECRET_KEY) {
      const callbackUrl = `${origin}/api/payments/paychangu-webhook`;
      const returnUrl = body.redirect_url || `${origin}/wallet?deposit=success`;
      const cancelUrl = `${origin}/wallet?deposit=cancelled`;

      const paychanguRes = await fetch(`${PAYCHANGU_API}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
        },
        body: JSON.stringify({
          amount: body.amount,
          currency: "MWK",
          email: user.email,
          first_name: user.email?.split("@")[0] || "Guest",
          last_name: "",
          callback_url: callbackUrl,
          return_url: returnUrl,
          cancellation_url: cancelUrl,
          tx_ref: txRef,
          customization: { title: "Wallet Top-Up", description: "Deposit to your Experio wallet" },
          meta: { type: "wallet_deposit", user_id: user.id },
        }),
      });

      const paychanguData = await paychanguRes.json();

      if (paychanguRes.ok && paychanguData?.data?.checkout_url) {
        await admin.from("payments").insert({
          user_id: user.id,
          amount: body.amount,
          currency: "MWK",
          method: "mobile_money",
          provider: "paychangu",
          provider_reference: txRef,
          status: "pending",
          metadata: { type: "wallet_deposit", checkout_url: paychanguData.data.checkout_url },
        });
        return json({ checkout_url: paychanguData.data.checkout_url });
      }

      return json({ error: "Payment service unavailable" }, 502);
    }

    // Dev mode fallback
    await admin.from("payments").insert({
      user_id: user.id,
      amount: body.amount,
      currency: "MWK",
      method: "mobile_money",
      provider: "paychangu",
      provider_reference: txRef,
      status: "pending",
      metadata: { type: "wallet_deposit", dev_mode: true },
    });

    return json({
      checkout_url: `${origin}/api/payments/paychangu-webhook?simulate=${txRef}`,
      dev_mode: true,
      message: "Payment service not configured. Dev mode active.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
