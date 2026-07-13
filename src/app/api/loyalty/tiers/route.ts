import { json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("loyalty_tiers")
      .select("*")
      .order("min_lifetime_points", { ascending: true });

    if (error) return json({ error: error.message }, 400);
    return json({ tiers: data || [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
