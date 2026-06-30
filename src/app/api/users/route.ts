import { requireAdmin, json, handleRouteError, parseBody, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    const admin = createAdminClient();
    let query = admin.from("users").select("*", { count: "exact" });

    if (params.role) query = query.eq("role", params.role);
    if (params.search) {
      query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

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
    const admin = await requireAdmin(request);
    const body = await parseBody<{ userId: string; role: string }>(request);

    if (!body.userId || !body.role) {
      return json({ error: "userId and role are required" }, 400);
    }
    if (!["user", "partner", "admin"].includes(body.role)) {
      return json({ error: "Invalid role" }, 400);
    }

    if (body.userId === admin.id) {
      return json({ error: "Cannot change your own role" }, 400);
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("users")
      .update({ role: body.role, updated_at: new Date().toISOString() })
      .eq("id", body.userId);

    if (error) throw error;
    return json({ message: "Role updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
