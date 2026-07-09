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
      .from("experiences")
      .select("id, title, category, status, price, booking_count, rating, location, created_at", { count: "exact" });

    if (params.status) query = query.eq("status", params.status);
    if (params.category) query = query.eq("category", params.category);
    if (params.search) query = query.ilike("title", `%${params.search}%`);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ experiences: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const { experienceId, status } = body;

    if (!experienceId || !status) return json({ error: "experienceId and status are required" }, 400);
    if (!["published", "draft", "archived", "paused"].includes(status)) {
      return json({ error: "Invalid status. Must be published, draft, archived, or paused" }, 400);
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("experiences")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", experienceId);

    if (error) return json({ error: error.message }, 400);

    return json({ message: "Experience status updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
