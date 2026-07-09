import { getUser, json, handleRouteError, getQueryParams, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "XPRO-";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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

/** Admin: manually issue a gift card */
export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{
      amount: number;
      currency?: string;
      recipient_name?: string;
      recipient_email?: string;
      sender_name?: string;
      message?: string;
      delivery_method?: string;
      occasion?: string;
    }>(request);

    if (!body.amount || body.amount < 1000) {
      return json({ error: "Minimum gift card amount is 1,000 MWK" }, 400);
    }

    let code = generateCode();
    const admin = createAdminClient();
    const { data: existing } = await admin.from("gift_cards").select("id").eq("code", code).maybeSingle();
    while (existing) {
      code = generateCode();
      const { data: retry } = await admin.from("gift_cards").select("id").eq("code", code).maybeSingle();
      if (!retry) break;
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data, error } = await admin
      .from("gift_cards")
      .insert({
        code,
        issuer_id: user.id,
        recipient_email: body.recipient_email ?? null,
        recipient_name: body.recipient_name ?? null,
        sender_name: body.sender_name ?? user.email,
        message: body.message ?? null,
        amount: body.amount,
        currency: body.currency ?? "MWK",
        balance: body.amount,
        delivery_method: body.delivery_method ?? "email",
        occasion: body.occasion ?? null,
        status: "active",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);

    await admin.from("gift_card_transactions").insert({
      gift_card_id: data.id,
      type: "purchase",
      amount: body.amount,
      balance_after: body.amount,
    });

    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
