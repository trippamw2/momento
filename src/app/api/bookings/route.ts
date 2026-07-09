import { getUser, json, handleRouteError, parseBody, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    const supabase = createServerClient();
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
    }>(request);

    if (!body.experience_id || !body.guests_count || !body.total_price || !body.experience_date) {
      return json({ error: "experience_id, guests_count, total_price, and experience_date are required" }, 400);
    }

    const supabase = createServerClient();

    const { data: experience } = await supabase
      .from("experiences")
      .select("id, title, price, max_guests, city, location")
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

    if (body.gift_card_code) {
      const { data: giftCard, error: gcFindError } = await admin
        .from("gift_cards")
        .select("*")
        .eq("code", body.gift_card_code.toUpperCase())
        .maybeSingle();

      if (gcFindError) {
        return json({ error: "Error looking up gift card" }, 500);
      }

      if (!giftCard) {
        return json({ error: "Invalid gift card code" }, 400);
      }

      if (giftCard.status !== "active" && giftCard.status !== "partially_redeemed") {
        return json({ error: `Gift card is ${giftCard.status}` }, 400);
      }

      if (giftCard.balance <= 0) {
        return json({ error: "Gift card has no remaining balance" }, 400);
      }

      if (giftCard.balance < serverPrice) {
        return json({
          error: `Insufficient gift card balance. Card has MK ${giftCard.balance.toLocaleString()} but the experience costs MK ${serverPrice.toLocaleString()}.`,
          card_balance: giftCard.balance,
          experience_price: serverPrice,
        }, 400);
      }

      const redeemAmount = serverPrice;
      const newBalance = giftCard.balance - redeemAmount;

      await admin
        .from("gift_cards")
        .update({
          balance: newBalance,
          status: newBalance === 0 ? "redeemed" : "partially_redeemed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", giftCard.id);
    }

    const { data, error } = await admin
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

    if (error) return json({ error: error.message }, 400);

    await admin.rpc("increment_experience_booking_count", { exp_id: body.experience_id });

    await admin.from("notifications").insert({
      user_id: user.id,
      type: "booking_pending",
      title: "Booking received",
      body: `Your booking for "${experience.title}" is being processed.`,
      data: { booking_id: data.id, experience_id: body.experience_id },
    });

    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
