import { getUser, json, handleRouteError, parseBody, badRequest } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{
      gift_card_id: string;
      to_email: string;
    }>(request);

    if (!body.gift_card_id || !body.to_email) {
      return badRequest("gift_card_id and to_email are required");
    }

    if (!body.to_email.includes("@")) {
      return badRequest("Invalid email address");
    }

    const admin = createAdminClient();

    // Verify gift card exists and belongs to user
    const { data: giftCard, error } = await admin
      .from("gift_cards")
      .select("*")
      .eq("id", body.gift_card_id)
      .eq("issuer_id", user.id)
      .single();

    if (error || !giftCard) {
      return badRequest("Gift card not found or you don't own it");
    }

    if (giftCard.status === "fully_redeemed" || giftCard.status === "expired" || giftCard.status === "cancelled") {
      return badRequest(`Cannot transfer a ${giftCard.status} gift card`);
    }

    // Check if user is trying to transfer to themselves
    if (giftCard.recipient_email?.toLowerCase() === body.to_email.toLowerCase()) {
      return badRequest("Gift card is already owned by this recipient");
    }

    // Check existing pending transfer
    const { data: existing } = await admin
      .from("gift_card_transfers")
      .select("id")
      .eq("gift_card_id", body.gift_card_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return badRequest("A pending transfer already exists for this gift card");
    }

    // Create transfer with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: transfer, error: txError } = await admin
      .from("gift_card_transfers")
      .insert({
        gift_card_id: body.gift_card_id,
        from_user_id: user.id,
        from_email: user.email,
        to_email: body.to_email,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (txError) return json({ error: txError.message }, 400);

    // Create notification for the recipient
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "gift_card_transferred",
      title: "Gift card transfer initiated",
      body: `A gift card worth MWK ${giftCard.amount.toLocaleString()} is being transferred to ${body.to_email}. They have 7 days to accept.`,
      data: { gift_card_id: body.gift_card_id, transfer_id: transfer.id, to_email: body.to_email },
    });

    return json(transfer, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
