import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = Math.max(0, parseInt(params.offset ?? "0"));

    const admin = createAdminClient();

    // Transfers where user is sender OR recipient
    const { data: transfers, count, error } = await admin
      .from("gift_card_transfers")
      .select("*, gift_card:gift_card_id(code, amount, currency, status)", { count: "exact" })
      .or(`from_user_id.eq.${user.id},to_email.eq.${user.email}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return json({ error: error.message }, 400);

    return json({ transfers, total: count, limit, offset });
  } catch (error) {
    return handleRouteError(error);
  }
}
