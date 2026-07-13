import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import {
  getCorporateAccountByAdmin,
  recordCorporateSpending,
  listCorporateSpending,
  getCorporateMember,
} from "@/lib/corporate-engine";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const accountId = url.searchParams.get("account_id");
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20")));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0"));

    // Determine which corporate account
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const account = await getCorporateAccountByAdmin(user.id);
      if (!account) return json({ error: "No corporate account found" }, 404);
      targetAccountId = account.id;
    } else if (user.role !== "admin") {
      const account = await getCorporateAccountByAdmin(user.id);
      if (!account || account.id !== targetAccountId) return json({ error: "Forbidden" }, 403);
    }

    const result = await listCorporateSpending(targetAccountId!, { limit, offset });

    // Enrich with user names
    const userIds = result.records.map((r) => r.userId);
    const supabase = createAdminClient();
    const { data: users } = await supabase
      .from("users")
      .select("id, email, full_name")
      .in("id", userIds.length ? userIds : ["none"]);
    const userMap = new Map((users || []).map((u: Record<string, unknown>) => [String(u.id), u]));

    const enriched = result.records.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || null,
    }));

    return json({ records: enriched, total: result.total, limit, offset });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await request.json();

    // Find the corporate account
    let accountId = body.account_id;
    if (!accountId) {
      const account = await getCorporateAccountByAdmin(user.id);
      if (!account) return json({ error: "No corporate account found" }, 404);
      accountId = account.id;
    }

    // Verify the user is a member of this account
    const member = await getCorporateMember(accountId!, user.id);
    if (!member) return json({ error: "You are not a member of this corporate account" }, 403);
    if (!member.isActive) return json({ error: "Your membership is disabled" }, 403);

    // Check member spending limit
    if (member.spendingLimit > 0 && body.amount > member.spendingLimit) {
      return json({ error: `Amount exceeds your spending limit of ${member.spendingLimit}` }, 400);
    }

    const result = await recordCorporateSpending({
      corporateAccountId: accountId!,
      memberId: member.id,
      userId: user.id,
      amount: body.amount,
      category: body.category || "general",
      description: body.description || null,
    });

    if ("error" in result) return json({ error: result.error }, 400);
    return json(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
