import { getUser, json, handleRouteError, parseBody, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    await getUser(request);
    const params = getQueryParams(request.url);

    const supabase = createServerClient();
    let query = supabase
      .from("review_flags")
      .select("*, review:review_id(*, user:user_id(full_name)), flagged_by_user:flagged_by(full_name)", { count: "exact" });

    if (params.status) query = query.eq("status", params.status);

    const { data, count, error } = await query
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json({ flags: data, total: count });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ flag_id: string; status: string; review_status?: string }>(request);
    if (!body.flag_id || !body.status) {
      return json({ error: "flag_id and status are required" }, 400);
    }

    const admin = createAdminClient();
    const { data: flag } = await admin
      .from("review_flags")
      .select("review_id")
      .eq("id", body.flag_id)
      .single();

    if (!flag) return json({ error: "Flag not found" }, 404);

    const { error: flagError } = await admin
      .from("review_flags")
      .update({ status: body.status, resolved_by: user.id, resolved_at: new Date().toISOString() })
      .eq("id", body.flag_id);

    if (flagError) return json({ error: flagError.message }, 400);

    if (body.review_status) {
      const { error: reviewError } = await admin
        .from("reviews")
        .update({
          status: body.review_status,
          is_flagged: false,
          flag_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", flag.review_id);

      if (reviewError) return json({ error: reviewError.message }, 400);
    }

    return json({ message: "Flag resolved" });
  } catch (error) {
    return handleRouteError(error);
  }
}
