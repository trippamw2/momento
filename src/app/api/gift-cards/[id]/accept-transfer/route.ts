import { getUser, json, handleRouteError, parseBody, badRequest, notFound } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const giftCardId = params.id;
    const admin = createAdminClient();

    // Find the pending transfer for this gift card
    const { data: transfer, error: tError } = await admin
      .from("gift_card_transfers")
      .select("*")
      .eq("gift_card_id", giftCardId)
      .eq("status", "pending")
      .maybeSingle();

    if (tError || !transfer) {
      return notFound("No pending transfer found for this gift card");
    }

    // Verify the user is the intended recipient
    if (transfer.to_email.toLowerCase() !== user.email.toLowerCase()) {
      return json({ error: "This transfer was not intended for you" }, 403);
    }

    // Check expiry
    if (new Date(transfer.expires_at) < new Date()) {
      await admin
        .from("gift_card_transfers")
        .update({ status: "expired" })
        .eq("id", transfer.id);
      return badRequest("Transfer has expired");
    }

    // Validate the gift card still exists and is transferable
    const { data: giftCard, error: gcError } = await admin
      .from("gift_cards")
      .select("*")
      .eq("id", giftCardId)
      .single();

    if (gcError || !giftCard) {
      return notFound("Gift card not found");
    }

    if (giftCard.status === "fully_redeemed" || giftCard.status === "expired" || giftCard.status === "cancelled") {
      await admin
        .from("gift_card_transfers")
        .update({ status: "expired" })
        .eq("id", transfer.id);
      return badRequest("Gift card is no longer active");
    }

    // Accept transfer: update gift card recipient and owner
    const updateData: Record<string, unknown> = {
      recipient_email: transfer.to_email,
      recipient_name: user.email?.split("@")[0] || "Recipient",
      transfer_count: (giftCard.transfer_count || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await admin
      .from("gift_cards")
      .update(updateData)
      .eq("id", giftCardId);

    if (updateError) return json({ error: updateError.message }, 400);

    // Mark transfer as accepted
    await admin
      .from("gift_card_transfers")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", transfer.id);

    // Notify both parties
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "gift_card_transferred",
      title: "Gift card transferred to you",
      body: `A gift card worth MWK ${giftCard.amount.toLocaleString()} has been transferred to you. Code: ${giftCard.code}`,
      data: { gift_card_id: giftCardId, code: giftCard.code },
    });

    // Notify original sender if they're a different user
    if (transfer.from_user_id) {
      await admin.from("notifications").insert({
        user_id: transfer.from_user_id,
        type: "gift_card_transferred",
        title: "Gift card transfer accepted",
        body: `Your gift card transfer has been accepted by ${user.email}.`,
        data: { gift_card_id: giftCardId, transfer_id: transfer.id },
      });
    }

    return json({ ok: true, message: "Transfer accepted", gift_card_id: giftCardId });
  } catch (error) {
    return handleRouteError(error);
  }
}
