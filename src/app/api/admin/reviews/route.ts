import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? "50")));
    const offset = (page - 1) * limit;

    const admin = createAdminClient();

    let query = admin
      .from("reviews")
      .select("id, rating, title, body, status, created_at, user:user_id(full_name, avatar_url), experience:experience_id(title, slug)", { count: "exact" });

    if (params.status) query = query.eq("status", params.status);
    if (params.rating) query = query.eq("rating", parseInt(params.rating));

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ reviews: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const { reviewId, status } = body;

    if (!reviewId || !status) return json({ error: "reviewId and status are required" }, 400);
    if (!["approved", "rejected", "pending"].includes(status)) {
      return json({ error: "Invalid status. Must be approved, rejected, or pending" }, 400);
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("reviews")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reviewId);

    if (error) return json({ error: error.message }, 400);

    return json({ message: "Review status updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
