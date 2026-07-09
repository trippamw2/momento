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
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (params.unread === "true") query = query.eq("is_read", false);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ notifications: data, total: count, unread: (data ?? []).filter((n) => !n.is_read).length, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ ids?: string[]; markAll?: boolean }>(request);

    const admin = createAdminClient();
    const updateData = { is_read: true, read_at: new Date().toISOString() };

    if (body.markAll) {
      const { error } = await admin
        .from("notifications")
        .update(updateData)
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) return json({ error: error.message }, 400);
      return json({ message: "All notifications marked as read" });
    }

    if (!body.ids || body.ids.length === 0) {
      return json({ error: "ids array or markAll is required" }, 400);
    }

    const { error } = await admin
      .from("notifications")
      .update(updateData)
      .in("id", body.ids)
      .eq("user_id", user.id);

    if (error) return json({ error: error.message }, 400);
    return json({ message: `${body.ids.length} notification(s) marked as read` });
  } catch (error) {
    return handleRouteError(error);
  }
}
