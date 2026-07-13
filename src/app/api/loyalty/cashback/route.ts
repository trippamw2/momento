import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cashback_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return json({ error: error.message }, 400);
    return json({ cashback: data || [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
