import { getUser, json, handleRouteError, badRequest, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const { booking_id, voucher_code, currency = "MWK" } = body;

    if (!booking_id || !voucher_code) {
      return badRequest("booking_id and voucher_code are required");
    }

    const admin = createAdminClient();

    // Verify booking belongs to user
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("*, experience:experience_id(title, slug, price, currency, location)")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) return json({ error: "Booking not found" }, 404);
    if (booking.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (booking.status !== "pending") return json({ error: "Booking already processed" }, 400);

    // Lookup and validate voucher
    const { data: voucher, error: voucherError } = await admin
      .from("gift_cards")
      .select("id, code, balance, amount, status")
      .eq("code", voucher_code.toUpperCase())
      .single();

    if (voucherError || !voucher) {
      return json({ error: "Invalid voucher code" }, 400);
    }

    if (!["active", "partially_redeemed"].includes(voucher.status)) {
      return json({ error: `Voucher is ${voucher.status} - cannot be used` }, 400);
    }

    if (voucher.balance <= 0) {
      return json({ error: "Voucher has no remaining balance" }, 400);
    }

    const voucherAmount = voucher.amount || voucher.balance || 0;
    const paymentAmount = voucherAmount <= booking.total_price ? voucherAmount : booking.total_price;

    // Create payment record for voucher usage
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .insert({
        booking_id,
        user_id: user.id,
        amount: -paymentAmount, // Negative amount for credit
        currency: currency || "MWK",
        method: "voucher",
        provider: "experio_voucher",
        provider_reference: `VCHR-${voucher.code}-${Math.random().toString(36).substr(2, 8).toUpperCase()}----------${Date.now()}`,
        status: "succeeded",
        metadata: {
          voucher_id: voucher.id,
          voucher_code: voucher.code,
          voucher_amount: voucherAmount,
          applied_amount: paymentAmount,
          booking_remaining: booking.total_price - paymentAmount,
          webhook_url: `${request.headers.get("origin") || "http://localhost:3000"}/api/payments/voucher-webhook`,
        },
      })
      .select()
      .single();

    if (paymentError) return json({ error: paymentError.message }, 400);

    // Update voucher balance
    const newVoucherBalance = voucher.balance - paymentAmount;
    const newVoucherStatus = newVoucherBalance <= 0 ? "redeemed" : "partially_redeemed";

    await admin
      .from("gift_cards")
      .update({
        balance: newVoucherBalance,
        status: newVoucherStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", voucher.id);

    // Update booking payment records with voucher credit
    await admin
      .from("payments")
      .insert({
        booking_id,
        user_id: user.id,
        amount: -paymentAmount,
        currency: currency || "MWK",
        method: "gift_card",
        provider: "experio_gift_card",
        provider_reference: `VCHR-USAGE-${Date.now()}`,
        status: "succeeded",
        metadata: {
          voucher_id: voucher.id,
          voucher_code: voucher.code,
          applied_to_booking_id: booking_id,
        },
      });

    // Update booking status if fully paid with voucher
    if (booking.total_price <= paymentAmount) {
      await admin
        .from("bookings")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking_id);

      // Create notification
      await admin.from("notifications").insert({
        user_id: user.id,
        type: "payment_success",
        title: "Voucher Payment Successful",
        body: `Your booking for "${booking.experience?.title || "Experience"}" has been confirmed using voucher ${voucher.code}.`,
        data: { booking_id, payment_id: payment.id, payment_method: "voucher", voucher_amount: voucherAmount },
      });

      // Send confirmation email
      await sendConfirmationEmail(user.email, booking, payment, "voucher", voucher.code, voucherAmount);
    } else {
      // Partially paid - create notification for partial payment
      await admin.from("notifications").insert({
        user_id: user.id,
        type: "payment_partial",
        title: "Partial Payment with Voucher",
        body: `Your booking for "${booking.experience?.title || "Experience"}" has been partially paid with voucher ${voucher.code}. Remaining amount: MK ${booking.total_price - paymentAmount}.`,
        data: { booking_id, payment_id: payment.id, payment_method: "voucher", voucher_amount: voucherAmount, remaining: booking.total_price - paymentAmount },
      });
    }

    // Return success response
    return json({
      success: true,
      payment_id: payment.id,
      voucher_code: voucher.code,
      amount_applied: paymentAmount,
      voucher_amount: voucherAmount,
      booking_remaining: booking.total_price - paymentAmount,
      status: "succeeded",
      message: paymentAmount >= booking.total_price
        ? "Voucher fully applied - booking confirmed!"
        : "Voucher applied - booking partially paid",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function sendConfirmationEmail(
  email: string | null,
  booking: { experience?: { title?: string; slug?: string; location?: string; price?: number } },
  payment: { id: string; amount: number; currency: string },
  method: string,
  voucherCode: string,
  voucherAmount: number
): Promise<void> {
  // Send email confirmation (implement with Brevo/Postgres)
  console.log(`Email confirmation sent to ${email} for voucher ${voucherCode} payment ${payment.id} (${voucherAmount} ${payment.currency}) via ${method}`);
  // await sendEmail(email, { subject: "Voucher Applied Successfully", template: "voucher-success", data: { booking, payment, voucherCode, voucherAmount, method } });
}