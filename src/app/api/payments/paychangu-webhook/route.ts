import { json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendBookingConfirmation, sendGiftCardEmail } from "@/lib/brevo";

/**
 * PayChangu Webhook Handler
 *
 * Called by PayChangu server-to-server after payment events.
 * - For booking payments: updates booking status to "confirmed"
 * - For gift card payments: creates the gift card and transaction record
 *
 * PayChangu sends a POST with JSON body:
 * {
 *   "event_type": "api.charge.payment",
 *   "status": "success",
 *   "reference": "MOMO-XXXXXXXX",
 *   "charge_id": "...",
 *   "amount": 1000,
 *   ...
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { status, reference, event_type } = body;
    const txRef = reference || body.tx_ref;

    // Only process completed payments
    if (status !== "success" && status !== "completed") {
      return json({ ok: true, message: "Event ignored — not a success status" });
    }

    if (!txRef) {
      console.warn("PayChangu webhook: missing reference", body);
      return json({ ok: false, message: "Missing reference" }, 400);
    }

    const admin = createAdminClient();

    // Find the payment record by provider_reference
    const { data: payment, error: payError } = await admin
      .from("payments")
      .select("*")
      .eq("provider_reference", txRef)
      .maybeSingle();

    if (payError || !payment) {
      console.warn(`PayChangu webhook: no payment found for ref "${txRef}"`);
      return json({ ok: false, message: "Payment not found" }, 404);
    }

    // Update payment status to succeeded
    await admin
      .from("payments")
      .update({
        status: "succeeded",
        provider_reference: body.charge_id || txRef,
        metadata: { ...(payment.metadata as Record<string, unknown>), webhook_event: body },
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    const metadata = (payment.metadata || {}) as Record<string, unknown>;

    // ─────────────────────────────────────────
    // CASE 1: Booking payment
    // ─────────────────────────────────────────
    if (payment.booking_id) {
      // Fetch full booking + user + experience details for email
      const { data: booking } = await admin
        .from("bookings")
        .select("*, users(email, full_name), experiences(title, location, partners(business_name))")
        .eq("id", payment.booking_id)
        .maybeSingle();

      const { error: bookingError } = await admin
        .from("bookings")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.booking_id);

      if (bookingError) {
        console.error(`Failed to update booking ${payment.booking_id}:`, bookingError);
      } else {
        console.log(`Booking ${payment.booking_id} confirmed via webhook`);
      }

      // Create notification for user
      await admin.from("notifications").insert({
        user_id: payment.user_id,
        type: "payment_success",
        title: "Payment successful",
        body: "Your booking has been confirmed.",
        data: { booking_id: payment.booking_id, payment_id: payment.id },
      });

      // Send Brevo confirmation email
      if (booking?.users?.email) {
        const exp = booking.experiences as Record<string, unknown> | null;
        const partner = exp?.partners as Record<string, unknown> | null;
        const emailResult = await sendBookingConfirmation({
          email: booking.users.email,
          guestName: booking.users.full_name || "Guest",
          experienceTitle: (exp?.title as string) || "Experience",
          experienceDate: booking.booking_date || "",
          experienceTime: (booking.time_slot as string) || "",
          guests: booking.guests_count || 1,
          totalPrice: booking.total_amount || payment.amount,
          currency: booking.currency || "MWK",
          bookingId: booking.id,
          location: (exp?.location as string) || "",
          partnerName: (partner?.business_name as string) || "",
        });
        if (!emailResult.success) {
          console.error("Failed to send booking confirmation email:", emailResult.error);
        }
      }

      return json({ ok: true, message: "Booking confirmed" });
    }

    // ─────────────────────────────────────────
    // CASE 2: Gift card payment
    // ─────────────────────────────────────────
    if (metadata.type === "gift_card") {
      // Idempotency check: if this payment already has a gift_card_id, return the existing card
      if (payment.gift_card_id) {
        const { data: existingCard } = await admin
          .from("gift_cards")
          .select("*")
          .eq("id", payment.gift_card_id)
          .single();
        if (existingCard) {
          console.log(`Webhook: gift card ${existingCard.code} already exists for payment ${payment.id}, skipping creation`);
          return json({ ok: true, message: "Gift card already exists", code: existingCard.code, gift_card_id: existingCard.id });
        }
      }

      const giftDetails = metadata.gift_details as Record<string, unknown> || {};

      // Generate unique gift card code
      const code = await generateUniqueCode(admin);

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { data: giftCard, error: gcError } = await admin
        .from("gift_cards")
        .insert({
          code,
          issuer_id: payment.user_id,
          recipient_email: giftDetails.recipient_email || null,
          recipient_name: giftDetails.recipient_name || null,
          sender_name: giftDetails.sender_name || payment.user_id,
          message: giftDetails.message || null,
          amount: payment.amount,
          currency: payment.currency || "MWK",
          balance: payment.amount,
          delivery_method: giftDetails.delivery_method || "email",
          occasion: giftDetails.occasion || null,
          design: giftDetails.design || null,
          status: "active",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (gcError) {
        console.error("Failed to create gift card from webhook:", gcError);
        return json({ ok: false, message: "Failed to create gift card" }, 500);
      }

      // Record purchase transaction
      await admin.from("gift_card_transactions").insert({
        gift_card_id: giftCard.id,
        type: "purchase",
        amount: payment.amount,
        balance_after: payment.amount,
      });

      // Link payment to gift card
      await admin
        .from("payments")
        .update({ gift_card_id: giftCard.id })
        .eq("id", payment.id);

      // Create notification for issuer
      await admin.from("notifications").insert({
        user_id: payment.user_id,
        type: "gift_card_purchased",
        title: "Gift card purchased",
        body: `Your gift card of MWK ${payment.amount.toLocaleString()} has been paid and is ready to send.`,
        data: { gift_card_id: giftCard.id, code },
      });

      // Send Brevo gift card email to recipient if email provided
      if (giftDetails.recipient_email) {
        const emailResult = await sendGiftCardEmail({
          recipientEmail: giftDetails.recipient_email as string,
          recipientName: (giftDetails.recipient_name as string) || "Friend",
          senderName: (giftDetails.sender_name as string) || "Someone",
          amount: payment.amount,
          currency: payment.currency || "MWK",
          code,
          message: giftDetails.message as string | undefined,
          occasion: giftDetails.occasion as string | undefined,
        });
        if (!emailResult.success) {
          console.error("Failed to send gift card email:", emailResult.error);
        }
      }

      console.log(`Gift card ${code} created from webhook payment ${payment.id}`);

      return json({ ok: true, message: "Gift card created", code });
    }

    // Unknown payment type — just acknowledge
    console.log("Webhook processed payment with no specific handler:", payment.id);
    return json({ ok: true, message: "Payment recorded" });
  } catch (error) {
    console.error("PayChangu webhook error:", error);
    // Always return 200 to acknowledge receipt
    return json({ ok: true, message: "Received" });
  }
}

/**
 * Generate a unique gift card code.
 */
async function generateUniqueCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let attempt = 0; attempt < 10; attempt++) {
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
  // Fallback: add timestamp to ensure uniqueness
  return `MOMO-${Date.now().toString(36).toUpperCase()}`;
}
