import { getUser, json, handleRouteError, badRequest, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const { booking_id, amount, card_details, currency = "MWK" } = body;

    if (!booking_id || !amount || !card_details) {
      return badRequest("booking_id, amount, and card_details are required");
    }

    const admin = createAdminClient();

    // Verify booking belongs to user
    const { data: booking, error } = await admin
      .from("bookings")
      .select("*, experience:experience_id(title, slug, price, currency, location)")
      .eq("id", booking_id)
      .single();

    if (error || !booking) return json({ error: "Booking not found" }, 404);
    if (booking.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (booking.status !== "pending") return json({ error: "Booking already processed" }, 400);

    // Validate card details (simplified - in real app would use Stripe/PayPal)
    const { number, exp_month, exp_year, cvc, cardholder_name } = card_details;
    if (!number || !exp_month || !exp_year || !cvc || !cardholder_name) {
      return badRequest("Invalid card details - all fields required");
    }

    // Simulate card validation (in production: use Stripe SDK)
    if (number.replace(/\s/g, '').length < 13 || number.replace(/\s/g, '').length > 19) {
      return badRequest("Invalid card number");
    }

    if (!/^(0[1-9]|1[0-2])$/gm.test(exp_month.toString()) || exp_year < 2024 || exp_year > 2034) {
      return badRequest("Invalid expiration date");
    }

    if (!/^[0-9]{3,4}$/.test(cvc.toString())) {
      return badRequest("Invalid CVV");
    }

    // Create payment record
    const paymentAmount = amount || booking.total_price;
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .insert({
        booking_id,
        user_id: user.id,
        amount: paymentAmount,
        currency: currency || "MWK",
        method: "card",
        provider: "stripe",
        provider_reference: `CARD-${booking_id}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, // TODO: Replace with real Stripe payment intent
        status: "pending",
        metadata: {
          card_last4: number.slice(-4),
          card_brand: getCardBrand(number),
          cardholder_name,
          webhook_url: `${request.headers.get("origin") || "http://localhost:3000"}/api/payments/card-webhook`,
        },
      })
      .select()
      .single();

    if (paymentError) return json({ error: paymentError.message }, 400);

    // Process card payment (simulated)
    const paymentResult = await processCardPayment(payment, card_details);

    // Update payment status
    await admin
      .from("payments")
      .update({
        status: paymentResult.status,
        provider_reference: paymentResult.transaction_id,
        metadata: {
          ...payment.metadata as Record<string, unknown> || {},
          payment_result: paymentResult,
          webhook_event: { status: paymentResult.status, card_details },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // Update booking status if payment successful
    if (paymentResult.status === "succeeded") {
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
        title: "Card Payment Successful",
        body: `Your booking for "${booking.experience?.title || 'Experience'}" has been confirmed via card payment.`,
        data: { booking_id, payment_id: payment.id, payment_method: "card" },
      });

      // Send confirmation email
      await sendConfirmationEmail(user.email, booking, payment, "card");
    }

    // Return appropriate response based on payment status
    if (paymentResult.status === "requires_action") {
      return json({
        status: "requires_action",
        payment_id: payment.id,
        client_secret: paymentResult.client_secret || "TODO: Return Stripe client_secret",
        message: "Additional authentication required",
      });
    } else {
      return json({
        success: true,
        payment_id: payment.id,
        status: paymentResult.status,
        message: paymentResult.status === "succeeded"
          ? "Card payment processed successfully"
          : "Payment processing completed",
      });
    }
  } catch (error) {
    return handleRouteError(error);
  }
}

function getCardBrand(number: string): string {
  const clean = number.replace(/\s/g, '');
  if (/^4/.test(clean)) return "visa";
  if (/^5[12345]/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^6(?:0|1)/.test(clean)) return "discover";
  return "unknown";
}

async function processCardPayment(
  payment: { id: string; user_id: string; amount: number; currency: string; metadata?: Record<string, unknown> },
  cardDetails: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
    cardholder_name: string;
  }
): Promise<{ 
  status: "succeeded" | "failed" | "pending" | "requires_action";
  transaction_id: string;
  client_secret?: string;
}> {
  // Simulate payment processing
  // In production: integrate with Stripe/Payment gateway

  // Simulate 90% success rate for demonstration
  const shouldSucceed = Math.random() > 0.1;

  if (shouldSucceed) {
    return {
      status: "succeeded",
      transaction_id: `TXN-${Math.random().toString(36).substr(2, 10).toUpperCase()}----------${Date.now()}`,
      client_secret: `seti_${Math.random().toString(36).substr(2, 32)}_${Date.now()}`
    };
  } else {
    return {
      status: "failed",
      transaction_id: `TXN-${Math.random().toString(36).substr(2, 10).toUpperCase()}----------${Date.now()}`,
    };
  }
}

async function sendConfirmationEmail(
  email: string | null,
  booking: { experience?: { title?: string; slug?: string; location?: string; price?: number } },
  payment: { id: string; amount: number; currency: string },
  method: string
): Promise<void> {
  // Send email confirmation (implement with Brevo/Postgres)
  console.log(`Email confirmation sent to ${email} for payment ${payment.id} via ${method}`);
  // await sendEmail(email, { subject: "Payment Confirmed", template: "payment-success", data: { booking, payment, method } });
}