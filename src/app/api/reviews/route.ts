import { getUser, json, handleRouteError, parseBody, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    const supabase = createServerClient();
    let query = supabase
      .from("reviews")
      .select("*, user:user_id(full_name, avatar_url), experience:experience_id(title, slug)", { count: "exact", head: false });

    const user = await getUser(request);
    if (!user || user.role !== "admin") {
      query = query.eq("status", "approved");
    }

    if (params.experience_id) query = query.eq("experience_id", params.experience_id);
    if (params.user_id) query = query.eq("user_id", params.user_id);
    if (params.status) query = query.eq("status", params.status);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ reviews: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{
      booking_id: string;
      experience_id: string;
      rating: number;
      title?: string;
      body?: string;
      images?: string[];
    }>(request);

    if (!body.booking_id || !body.experience_id || !body.rating) {
      return json({ error: "booking_id, experience_id, and rating are required" }, 400);
    }
    if (body.rating < 1 || body.rating > 5) {
      return json({ error: "Rating must be between 1 and 5" }, 400);
    }

    const supabase = createServerClient();

    const { data: booking } = await supabase
      .from("bookings")
      .select("id, user_id, status")
      .eq("id", body.booking_id)
      .single();

    if (!booking) return json({ error: "Booking not found" }, 404);
    if (booking.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (booking.status !== "completed") {
      return json({ error: "Can only review completed bookings" }, 400);
    }

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", body.booking_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) return json({ error: "You have already reviewed this booking" }, 409);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("reviews")
      .insert({
        booking_id: body.booking_id,
        user_id: user.id,
        experience_id: body.experience_id,
        rating: body.rating,
        title: body.title ?? null,
        body: body.body ?? null,
        images: body.images ?? [],
        is_verified: true,
        status: "approved",
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);

    const { data: stats } = await supabase
      .from("reviews")
      .select("rating")
      .eq("experience_id", body.experience_id)
      .eq("status", "approved");

    const ratings = (stats ?? []).map((r) => r.rating);
    const avgRating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : body.rating.toFixed(2);

    await admin
      .from("experiences")
      .update({
        rating: parseFloat(avgRating),
        review_count: ratings.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.experience_id);

    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
