import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

interface RedeemRequest {
  code: string;
  booking_id?: string;
  amount?: number;
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<RedeemRequest>(request);
    if (!body.code) return json({ error: "Gift card code is required" }, 400);

    const admin = createAdminClient();
    const { data: giftCard } = await admin
      .from("gift_cards")
      .select("*")
      .eq("code", body.code.toUpperCase())
      .single();

    if (!giftCard) return json({ error: "Invalid gift card code" }, 404);

    if (giftCard.status === "redeemed" || giftCard.status === "expired" || giftCard.status === "refunded" || giftCard.status === "cancelled") {
      return json({ error: `Gift card is ${giftCard.status}` }, 400);
    }

    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      await admin.from("gift_cards").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", giftCard.id);
      return json({ error: "Gift card has expired" }, 400);
    }

    if (giftCard.balance <= 0) {
      return json({ error: "Gift card has no remaining balance" }, 400);
    }

    const redeemAmount = body.amount ?? giftCard.balance;

    if (redeemAmount <= 0 || redeemAmount > giftCard.balance) {
      return json({ error: `Invalid amount. Available balance: ${giftCard.balance}` }, 400);
    }

    const newBalance = giftCard.balance - redeemAmount;
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {
      balance: newBalance,
      updated_at: now,
    };

    if (newBalance === 0) {
      updates.status = "redeemed";
      updates.redeemed_at = now;
    }

    const { error: updateError } = await admin
      .from("gift_cards")
      .update(updates)
      .eq("id", giftCard.id);

    if (updateError) return json({ error: updateError.message }, 400);

    if (body.booking_id) {
      await admin.from("gift_card_transactions").insert({
        gift_card_id: giftCard.id,
        booking_id: body.booking_id,
        type: "redemption",
        amount: redeemAmount,
        balance_after: newBalance,
      });
    }

    return json({
      valid: true,
      redeemed: true,
      amount_redeemed: redeemAmount,
      remaining_balance: newBalance,
      currency: giftCard.currency,
      recipient_name: giftCard.recipient_name,
      sender_name: giftCard.sender_name,
      status: newBalance === 0 ? "redeemed" : "active",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
