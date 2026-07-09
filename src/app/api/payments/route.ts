import { getUser, json, handleRouteError, parseBody, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    const supabase = createServerClient();
    let query = supabase
      .from("payments")
      .select("*, booking:booking_id(id, status, experience_id)", { count: "exact" })
      .eq("user_id", user.id);

    if (params.status) query = query.eq("status", params.status);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ payments: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{
      booking_id?: string;
      gift_card_id?: string;
      amount: number;
      method: string;
      provider?: string;
      provider_reference?: string;
      metadata?: Record<string, unknown>;
    }>(request);

    if (!body.amount || !body.method) {
      return json({ error: "amount and method are required" }, 400);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("payments")
      .insert({
        booking_id: body.booking_id ?? null,
        gift_card_id: body.gift_card_id ?? null,
        user_id: user.id,
        amount: body.amount,
        currency: "MWK",
        method: body.method,
        provider: body.provider ?? null,
        provider_reference: body.provider_reference ?? null,
        status: "pending",
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
