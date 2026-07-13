import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false });

    if (error) return json({ error: error.message }, 400);
    return json({ badges: data || [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
