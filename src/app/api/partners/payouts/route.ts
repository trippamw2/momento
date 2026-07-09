import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "partner") return json({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();

    // Get partner profile
    const { data: partner } = await admin
      .from("partners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!partner) return json({ error: "Partner profile not found" }, 404);

    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    let query = admin
      .from("payouts")
      .select("*", { count: "exact" })
      .eq("partner_id", partner.id);

    if (params.status) query = query.eq("status", params.status);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return json({ payouts: data ?? [], total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "partner") return json({ error: "Unauthorized" }, 401);

    const body = await request.json() as {
      amount: number;
      bank_name: string;
      account_number: string;
      account_name: string;
      payout_method: string;
    };

    if (!body.amount || !body.bank_name || !body.account_number || !body.account_name) {
      return json({ error: "amount, bank_name, account_number, and account_name are required" }, 400);
    }
    if (body.amount <= 0) {
      return json({ error: "Amount must be greater than 0" }, 400);
    }

    const admin = createAdminClient();

    // Get partner profile
    const { data: partner } = await admin
      .from("partners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!partner) return json({ error: "Partner profile not found" }, 404);

    // Check available balance
    const { data: earnings } = await admin
      .from("partner_earnings")
      .select("net_amount")
      .eq("partner_id", partner.id)
      .eq("status", "available");

    const { data: existingPayouts } = await admin
      .from("payouts")
      .select("amount")
      .eq("partner_id", partner.id)
      .in("status", ["pending", "approved", "processing"]);

    const totalEarnings = (earnings ?? []).reduce((sum: number, e: { net_amount: number }) => sum + e.net_amount, 0);
    const totalPendingPayouts = (existingPayouts ?? []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
    const availableBalance = totalEarnings - totalPendingPayouts;

    if (body.amount > availableBalance) {
      return json({ error: `Insufficient balance. Available: MK ${availableBalance.toLocaleString()}` }, 400);
    }

    // Create payout request
    const { data, error } = await admin
      .from("payouts")
      .insert({
        partner_id: partner.id,
        amount: body.amount,
        currency: "MWK",
        status: "pending",
        payout_method: body.payout_method,
        bank_name: body.bank_name,
        account_number: body.account_number,
        account_name: body.account_name,
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
