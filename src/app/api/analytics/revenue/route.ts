import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const days = parseInt(params.days ?? "30");

    const supabase = createServerClient();
    let query = supabase
      .from("payments")
      .select("amount, created_at, method, status");

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
      if (ids.length === 0) return json({ revenue: [], total: 0, period: `${days}d` });

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id")
        .in("experience_id", ids);

      const bookingIds = (bookings ?? []).map((b) => b.id);
      if (bookingIds.length === 0) return json({ revenue: [], total: 0, period: `${days}d` });

      query = query.in("booking_id", bookingIds);
    } else if (user.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    query = query.eq("status", "succeeded");
    query = query.gte("created_at", new Date(Date.now() - days * 86400000).toISOString());

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    const dailyMap = new Map<string, number>();
    const methodMap = new Map<string, number>();
    let total = 0;

    (data ?? []).forEach((p) => {
      const day = p.created_at.split("T")[0];
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + p.amount);
      methodMap.set(p.method, (methodMap.get(p.method) ?? 0) + p.amount);
      total += p.amount;
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const byMethod = Array.from(methodMap.entries())
      .map(([method, amount]) => ({ method, amount }));

    return json({ revenue: daily, byMethod, total, period: `${days}d` });
  } catch (error) {
    return handleRouteError(error);
  }
}
