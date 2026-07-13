import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Try Supabase first
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("balance, lifetime_points, tier, updated_at")
        .eq("user_id", user.id)
        .single();

      if (data) return json(data);
    } catch {
      // Fall through to mock
    }

    // Mock fallback — user has 0 points until they book
    return json({
      balance: 0,
      lifetime_points: 0,
      tier: "bronze",
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
