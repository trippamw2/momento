import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const days = parseInt(params.days ?? "30");

    const supabase = createAdminClient();
    let query = supabase
      .from("bookings")
      .select("id, status, total_price, created_at, experience_date");

    if (user.role === "partner") {
      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!partner) return json({ error: "Partner profile not found" }, 400);

      const { data: experiences } = await supabase
        .from("experiences")
        .select("id")
        .eq("partner_id", partner.id);

      const ids = (experiences ?? []).map((e) => e.id);
      if (ids.length === 0) {
        return json({ daily: [], byStatus: [], total: 0, period: `${days}d` });
      }
      query = query.in("experience_id", ids);
    } else if (user.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const since = new Date(Date.now() - days * 86400000).toISOString();
    query = query.gte("created_at", since);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    const dailyMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    let totalRevenue = 0;

    (data ?? []).forEach((b) => {
      const day = b.created_at.split("T")[0];
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
      statusMap.set(b.status, (statusMap.get(b.status) ?? 0) + 1);
      totalRevenue += b.total_price;
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const byStatus = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }));

    return json({ daily, byStatus, total: data?.length ?? 0, totalRevenue, period: `${days}d` });
  } catch (error) {
    return handleRouteError(error);
  }
}
