import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ code: string; booking_id?: string }>(request);
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

    return json({
      valid: true,
      balance: giftCard.balance,
      currency: giftCard.currency,
      recipient_name: giftCard.recipient_name,
      sender_name: giftCard.sender_name,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
