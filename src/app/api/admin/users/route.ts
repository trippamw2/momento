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
      .from("users")
      .select("id, email, full_name, phone, role, avatar_url, created_at", { count: "exact" });

    if (params.role) query = query.eq("role", params.role);
    if (params.search) query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ users: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) return json({ error: "userId and role are required" }, 400);
    if (!["user", "partner", "admin"].includes(role)) {
      return json({ error: "Invalid role. Must be user, partner, or admin" }, 400);
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("users")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) return json({ error: error.message }, 400);

    return json({ message: "User role updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
