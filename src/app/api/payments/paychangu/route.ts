import { getUser, json, handleRouteError, badRequest } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

const PAYCHANGU_API = process.env.PAYCHANGU_API_URL || "https://api.paychangu.com";
const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY || "";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { booking_id } = await request.json();
    if (!booking_id) return badRequest("booking_id is required");

    const supabase = createServerClient();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, experience:experience_id(title, slug, price, currency, location)")
      .eq("id", booking_id)
      .single();

    if (error || !booking) return json({ error: "Booking not found" }, 404);
    if (booking.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (booking.status !== "pending") return json({ error: "Booking is already processed" }, 400);

    const origin = request.headers.get("origin") || "http://localhost:3000";
    // Webhook URL for server-to-server payment confirmation
    const webhookUrl = `${origin}/api/payments/paychangu-webhook`;
    const returnUrl = `${origin}/bookings/${booking_id}?payment=success`;
    const cancelUrl = `${origin}/bookings/${booking_id}?payment=cancelled`;

    if (PAYCHANGU_SECRET_KEY) {
      // Real PayChangu API integration
      const payload = {
        amount: booking.total_price,
        currency: booking.currency || "MWK",
        email: user.email || booking.contact_email,
        first_name: user.email?.split("@")[0] || "Guest",
        last_name: "",
        callback_url: webhookUrl,
        return_url: returnUrl,
        cancellation_url: cancelUrl,
        tx_ref: `XPRO-${booking_id.slice(0, 8).toUpperCase()}`,
        meta: {
          booking_id,
          experience_title: booking.experience?.title || "",
        },
      };

      try {
        const paychanguRes = await fetch(`${PAYCHANGU_API}/payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
          },
          body: JSON.stringify({
            ...payload,
            customization: {
              title: "Experience Booking",
              description: booking?.experience?.title || "Booking payment",
            },
          }),
        });

        const paychanguData = await paychanguRes.json();

        if (paychanguRes.ok && paychanguData?.data?.checkout_url) {
          const admin = createAdminClient();
          await admin.from("payments").insert({
            booking_id,
            user_id: user.id,
            amount: booking.total_price,
            currency: booking.currency || "MWK",
            method: "paychangu",
            provider: "paychangu",
            provider_reference: paychanguData.data.data?.tx_ref || payload.tx_ref,
            status: "pending",
            metadata: { checkout_url: paychanguData.data.checkout_url },
          });

          return json({ checkout_url: paychanguData.data.checkout_url });
        }

        console.warn("PayChangu API error, falling back:", paychanguData);
      } catch (payErr) {
        console.warn("PayChangu API call failed, falling back:", payErr);
      }
    }

    // Fallback: simulate PayChangu checkout for development
    const txRef = `XPRO-${booking_id.slice(0, 8).toUpperCase()}`;
    const admin = createAdminClient();
    await admin.from("payments").insert({
      booking_id,
      user_id: user.id,
      amount: booking.total_price,
      currency: booking.currency || "MWK",
      method: "paychangu",
      provider: "paychangu",
      provider_reference: txRef,
      status: "pending",
      metadata: { checkout_url: returnUrl, webhook_url: webhookUrl },
    });

    // Return a mock checkout URL that simulates payment on the callback page
    return json({ checkout_url: `${origin}/bookings/${booking_id}?payment=initiated&tx_ref=${txRef}` });
  } catch (error) {
    return handleRouteError(error);
  }
}
