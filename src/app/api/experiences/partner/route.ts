import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createServerClient();
    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!partner) return json({ error: "Partner profile not found" }, 400);

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "50")));
    const offset = (page - 1) * limit;

    let query = supabase
      .from("experiences")
      .select("*, images:experience_images(url, alt, is_primary, sort_order), moods:experience_moods(mood_id, moods(id, label, emoji))", { count: "exact" })
      .eq("partner_id", partner.id);

    if (params.status) query = query.eq("status", params.status);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ experiences: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}
