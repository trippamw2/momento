import { getUser, json, handleRouteError, parseBody, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    const supabase = (await import("@/lib/supabase-server")).createServerClient();
    let query = supabase
      .from("saved_items")
      .select("*, experience:experience_id(id, title, slug, subtitle, price, currency, location, duration, rating, review_count, category, images:experience_images(url, alt, is_primary))", { count: "exact" })
      .eq("user_id", user.id);

    if (params.collection_id) query = query.eq("collection_id", params.collection_id);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ saved: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ experience_id: string; collection_id?: string }>(request);
    if (!body.experience_id) return json({ error: "experience_id is required" }, 400);

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("saved_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("experience_id", body.experience_id)
      .maybeSingle();

    if (existing) return json({ message: "Already saved", id: existing.id });

    const { data, error } = await admin
      .from("saved_items")
      .insert({
        user_id: user.id,
        experience_id: body.experience_id,
        collection_id: body.collection_id ?? null,
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
