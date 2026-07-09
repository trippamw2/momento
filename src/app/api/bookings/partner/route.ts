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

    const { data: experienceIds } = await supabase
      .from("experiences")
      .select("id")
      .eq("partner_id", partner.id);

    if (!experienceIds || experienceIds.length === 0) {
      return json({ bookings: [], total: 0 });
    }

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    const ids = experienceIds.map((e) => e.id);
    let query = supabase
      .from("bookings")
      .select("*, experience:experience_id(title, slug, location, price), user:user_id(full_name, avatar_url, phone, email)", { count: "exact" })
      .in("experience_id", ids);

    if (params.status) query = query.eq("status", params.status);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ bookings: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}
