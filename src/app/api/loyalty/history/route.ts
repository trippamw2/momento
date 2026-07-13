import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (data) return json({ transactions: data });
    } catch {
      // Fall through to mock
    }

    return json({ transactions: [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
