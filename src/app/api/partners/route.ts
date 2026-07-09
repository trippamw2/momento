import { json, handleRouteError, getUser, parseBody, getQueryParams } from "@/lib/api-helpers";
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
      .from("partners")
      .select("*, user:user_id(id, full_name, avatar_url)", { count: "exact" });

    query = query.eq("verification_status", "verified");
    query = query.eq("is_active", true);

    if (params.city) query = query.contains("cities", [params.city]);
    if (params.category) query = query.contains("categories", [params.category]);
    if (params.search) query = query.ilike("business_name", `%${params.search}%`);

    const { data, count, error } = await query
      .order("business_name")
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ partners: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) return json({ error: "Partner profile already exists" }, 409);

    const body = await parseBody<Record<string, unknown>>(request);
    const required = ["business_name"];
    for (const field of required) {
      if (!body[field]) return json({ error: `${field} is required` }, 400);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("partners")
      .insert({ user_id: user.id, ...body })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);

    await admin
      .from("users")
      .update({ role: "partner", updated_at: new Date().toISOString() })
      .eq("id", user.id);

    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
