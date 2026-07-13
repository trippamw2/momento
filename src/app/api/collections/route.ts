import { getUser, json, handleRouteError, parseBody, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const supabase = createAdminClient();
    let query = supabase
      .from("collections")
      .select("*, items:saved_items(count)", { count: "exact" })
      .or(`user_id.eq.${user.id},is_private.eq.false`);

    if (params.user_id) query = query.eq("user_id", params.user_id);

    const { data, count, error } = await query
      .order("created_at", { ascending: false });

    const collections = (data ?? []).map((c) => ({
      ...c,
      item_count: (c.items as unknown as { count: number }[])?.[0]?.count ?? 0,
      items: undefined,
    }));

    if (error) throw error;
    return json({ collections, total: count });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ name: string; description?: string; is_private?: boolean }>(request);
    if (!body.name) return json({ error: "Collection name is required" }, 400);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("collections")
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description ?? null,
        is_private: body.is_private ?? true,
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
