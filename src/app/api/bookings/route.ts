import { getUser, json, handleRouteError, parseBody, getQueryParams, badRequest } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";
import { payFromWallet } from "@/lib/wallet-engine";
import { creditBookingPoints } from "@/lib/loyalty-server";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();
    let query = supabase
      .from("bookings")
      .select("*, experience:experience_id(title, slug, location, price, currency, images:experience_images(url, alt, is_primary))", { count: "exact" })
      .eq("user_id", user.id);

    if (params.status) query = query.eq("status", params.status);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ bookings: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{
      experience_id: string;
      availability_id?: string;
      guests_count: number;
      total_price: number;
      experience_date: string;
      experience_time?: string;
      notes?: string;
      special_requests?: string;
      contact_phone?: string;
      contact_email?: string;
      gift_card_code?: string;
      pay_with_wallet?: boolean;
      pay_with_split?: { wallet?: number; gift_card?: string };
    }>(request);

    if (!body.experience_id || !body.guests_count || !body.total_price || !body.experience_date) {
      return json({ error: "experience_id, guests_count, total_price, and experience_date are required" }, 400);
    }

    const supabase = createAdminClient();

    const { data: experience } = await supabase
      .from("experiences")
      .select("id, title, price, max_guests, location")
      .eq("id", body.experience_id)
      .eq("status", "published")
      .single();

    if (!experience) return json({ error: "Experience not found or unavailable" }, 404);

    if (body.guests_count > experience.max_guests) {
      return json({ error: `Maximum ${experience.max_guests} guests allowed` }, 400);
    }

    const serverPrice = experience.price * body.guests_count;
    const priceTolerance = Math.abs(serverPrice - body.total_price);

    if (priceTolerance > 100) {
      return json({
        error: "Price mismatch - please refresh and try again",
        expected_price: serverPrice,
        sent_price: body.total_price,
      }, 400);
    }

    const admin = createAdminClient();

    // ── Step 1: Validate gift card before creating booking ──
    let giftCardId: string | null = null;
    if (body.gift_card_code) {
      const { data: giftCard, error: gcFindError } = await admin
        .from("gift_cards")
        .select("*")
        .eq("code", body.gift_card_code.toUpperCase())
        .maybeSingle();

      if (gcFindError) return json({ error: "Error looking up gift card" }, 500);
      if (!giftCard) return json({ error: "Invalid gift card code" }, 400);

      if (giftCard.status !== "active" && giftCard.status !== "partially_redeemed") {
        return json({ error: `Gift card is ${giftCard.status}` }, 400);
      }
      if (giftCard.balance <= 0) return json({ error: "Gift card has no remaining balance" }, 400);
      if (giftCard.balance < serverPrice) {
        return json({
          error: `Insufficient gift card balance. Card has MK ${giftCard.balance.toLocaleString()} but the experience costs MK ${serverPrice.toLocaleString()}.`,
          card_balance: giftCard.balance,
          experience_price: serverPrice,
        }, 400);
      }
      giftCardId = giftCard.id;
    }

    // ── Step 2: VALIDATE wallet balance BEFORE creating booking ──
    if (body.pay_with_wallet) {
      const wallet = await (await import("@/lib/wallet-engine")).getWallet(user.id);
      if (!wallet) return json({ error: "Wallet not found" }, 400);
      if (wallet.status !== "active") return json({ error: "Wallet is not active" }, 400);
      if (wallet.balance < serverPrice) return json({ error: "Insufficient wallet balance" }, 400);
    }

    // ── Step 3: Create booking FIRST (status = pending) ──
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert({
        user_id: user.id,
        experience_id: body.experience_id,
        availability_id: body.availability_id ?? null,
        guests_count: body.guests_count,
        total_price: serverPrice,
        currency: "MWK",
        status: "pending",
        notes: body.notes ?? null,
        special_requests: body.special_requests ?? null,
        contact_phone: body.contact_phone ?? null,
        contact_email: body.contact_email ?? user.email,
        experience_date: body.experience_date,
        experience_time: body.experience_time ?? null,
      })
      .select()
      .single();

    if (bookingError) return json({ error: bookingError.message }, 400);

    // ── Step 4: Process payments against the created booking ──

    // Process gift card (deduct balance)
    if (giftCardId) {
      const { data: giftCard } = await admin
        .from("gift_cards")
        .select("balance, code")
        .eq("id", giftCardId)
        .single();

      if (!giftCard) {
        return json({ error: "Gift card not found" }, 400);
      }

      const newBalance = giftCard.balance - serverPrice;
      await admin
        .from("gift_cards")
        .update({
          balance: newBalance,
          status: newBalance === 0 ? "redeemed" : "partially_redeemed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", giftCardId);

      // Create payment record for gift card usage
      await admin.from("payments").insert({
        booking_id: booking.id,
        user_id: user.id,
        amount: serverPrice,
        currency: "MWK",
        method: "gift_card",
        status: "succeeded",
        provider: "experio_gift_card",
        gift_card_id: giftCardId,
      });
    }

    // Process wallet payment
    if (body.pay_with_wallet) {
      const walletResult = await payFromWallet(user.id, serverPrice, {
        description: `Booking: ${experience.title}`,
        referenceType: "booking",
        referenceId: booking.id,
      });

      if ("error" in walletResult) {
        // Wallet payment failed after booking was created — flag the booking
        await admin.from("bookings")
          .update({ status: "payment_failed", updated_at: new Date().toISOString() })
          .eq("id", booking.id);
        return json({
          error: walletResult.error,
          booking_id: booking.id,
          payment_status: "failed",
        }, 400);
      }

      // Wallet succeeded — confirm the booking instantly
      await admin.from("bookings")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", booking.id);

      await admin.from("payments").insert({
        booking_id: booking.id,
        user_id: user.id,
        amount: serverPrice,
        currency: "MWK",
        method: "wallet",
        status: "succeeded",
        provider: "experio_wallet",
      });
    }

    // ── Step 5: Post-payment actions ──
    await admin.rpc("increment_experience_booking_count", { exp_id: body.experience_id });

    const finalStatus = body.pay_with_wallet ? "confirmed" : "pending";
    await admin.from("notifications").insert({
      user_id: user.id,
      type: finalStatus === "confirmed" ? "booking_confirmed" : "booking_pending",
      title: finalStatus === "confirmed" ? "Booking confirmed!" : "Booking received",
      body: finalStatus === "confirmed"
        ? `Your booking for "${experience.title}" is confirmed. Get ready for an unforgettable time!`
        : `Your booking for "${experience.title}" is being processed.`,
      data: { booking_id: booking.id, experience_id: body.experience_id },
    });

    // Credit loyalty points for wallet-paid bookings (instantly confirmed)
    if (body.pay_with_wallet) {
      const pointsResult = await creditBookingPoints(
        user.id,
        serverPrice,
        booking.id,
        experience.title
      );
      if ("error" in pointsResult) {
        console.error("Failed to credit loyalty points:", pointsResult.error);
      }
    }

    // Return booking with final status
    return json({ ...booking, status: finalStatus }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
