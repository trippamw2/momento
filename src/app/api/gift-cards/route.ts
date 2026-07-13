import { getUser, json, handleRouteError, parseBody, getQueryParams, badRequest } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { payFromWallet } from "@/lib/wallet-engine";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "XPRO-";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    const admin = createAdminClient();
    let query = admin
      .from("gift_cards")
      .select("*", { count: "exact" })
      .or(`issuer_id.eq.${user.id},recipient_email.eq.${user.email}`);

    if (params.status) query = query.eq("status", params.status);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ giftCards: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{
      amount: number;
      recipient_email?: string;
      recipient_name?: string;
      sender_name?: string;
      message?: string;
      delivery_method?: string;
      occasion?: string;
      design?: string;
      pay_with_wallet?: boolean;
    }>(request);

    if (!body.amount || body.amount < 1000) {
      return json({ error: "Minimum gift card amount is 1,000 MWK" }, 400);
    }

    let code = generateCode();
    const admin = createAdminClient();
    const { data: existing } = await admin.from("gift_cards").select("id").eq("code", code).maybeSingle();
    while (existing) {
      code = generateCode();
      const { data: retry } = await admin.from("gift_cards").select("id").eq("code", code).maybeSingle();
      if (!retry) break;
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data, error } = await admin
      .from("gift_cards")
      .insert({
        code,
        issuer_id: user.id,
        recipient_email: body.recipient_email ?? null,
        recipient_name: body.recipient_name ?? null,
        sender_name: body.sender_name ?? user.email,
        message: body.message ?? null,
        amount: body.amount,
        currency: "MWK",
        balance: body.amount,
        delivery_method: body.delivery_method ?? "email",
        occasion: body.occasion ?? null,
        design: body.design ?? null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);

    await admin.from("gift_card_transactions").insert({
      gift_card_id: data.id,
      type: "purchase",
      amount: body.amount,
      balance_after: body.amount,
    });

    // Process wallet payment if requested
    if (body.pay_with_wallet) {
      const walletResult = await payFromWallet(user.id, body.amount, {
        description: `Gift card purchase: ${data.code}`,
        referenceType: "gift_card",
        referenceId: data.id,
      });

      if ("error" in walletResult) {
        // Gift card was created but payment failed — mark as cancelled
        await admin
          .from("gift_cards")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", data.id);
        return badRequest(`Wallet payment failed: ${walletResult.error}. Gift card has been cancelled.`);
      }

      // Mark gift card as paid/sent (wallet is instant)
      await admin
        .from("gift_cards")
        .update({ sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", data.id);

      // Record wallet payment
      await admin.from("payments").insert({
        booking_id: null,
        user_id: user.id,
        amount: body.amount,
        currency: "MWK",
        method: "wallet",
        status: "succeeded",
        provider: "experio_wallet",
        gift_card_id: data.id,
      });
    }

    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
