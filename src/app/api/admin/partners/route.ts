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
      .from("partners")
      .select("id, business_name, business_email, verification_status, is_active, created_at, user:user_id(full_name, email, avatar_url)", { count: "exact" });

    if (params.status) query = query.eq("verification_status", params.status);
    if (params.search) query = query.ilike("business_name", `%${params.search}%`);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ partners: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const { partnerId, verification_status, is_active } = body;

    if (!partnerId) return json({ error: "partnerId is required" }, 400);

    const admin = createAdminClient();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (verification_status) updates.verification_status = verification_status;
    if (is_active !== undefined) updates.is_active = is_active;

    const { error } = await admin
      .from("partners")
      .update(updates)
      .eq("id", partnerId);

    if (error) return json({ error: error.message }, 400);

    return json({ message: "Partner updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
