import { json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const params = getQueryParams(request.url);
    const admin = createAdminClient();

    let query = admin
      .from("gift_card_designs")
      .select("*")
      .eq("is_active", true);

    if (params.premium === "true") {
      query = query.eq("is_premium", true);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) return json({ error: error.message }, 400);
    return json({ designs: data || [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
