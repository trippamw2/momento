import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? "50")));
    const offset = (page - 1) * limit;

    const admin = createAdminClient();

    let query = admin
      .from("gift_cards")
      .select("id, code, amount, balance, currency, status, recipient_name, recipient_email, sender_name, created_at, expires_at", { count: "exact" });

    if (params.status) query = query.eq("status", params.status);
    if (params.search) query = query.or(`code.ilike.%${params.search}%,recipient_name.ilike.%${params.search}%,sender_name.ilike.%${params.search}%`);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ giftCards: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}
