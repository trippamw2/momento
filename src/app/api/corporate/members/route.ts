import { getUser, json, handleRouteError, notFound } from "@/lib/api-helpers";
import {
  getCorporateAccountByAdmin,
  addCorporateMember,
  listCorporateMembers,
  removeCorporateMember,
} from "@/lib/corporate-engine";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const accountId = url.searchParams.get("account_id");

    // Determine which corporate account to look up
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const account = await getCorporateAccountByAdmin(user.id);
      if (!account) return json({ error: "No corporate account found" }, 404);
      targetAccountId = account.id;
    } else if (user.role !== "admin") {
      // Non-admin must own the account
      const account = await getCorporateAccountByAdmin(user.id);
      if (!account || account.id !== targetAccountId) {
        return json({ error: "Forbidden" }, 403);
      }
    }

    const result = await listCorporateMembers(targetAccountId!);

    // Enrich with user details
    const userIds = result.members.map((m) => m.userId);
    const supabase = createAdminClient();
    const { data: userProfiles } = await supabase
      .from("users")
      .select("id, email, full_name, phone, avatar_url")
      .in("id", userIds.length ? userIds : ["none"]);

    const userMap = new Map((userProfiles || []).map((p: Record<string, unknown>) => [String(p.id), p]));

    const enriched = result.members.map((m) => ({
      ...m,
      user: userMap.get(m.userId) || null,
    }));

    return json({ members: enriched });
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
    } else if (user.role !== "admin") {
      const account = await getCorporateAccountByAdmin(user.id);
      if (!account || account.id !== accountId) return json({ error: "Forbidden" }, 403);
    }

    const result = await addCorporateMember({
      corporateAccountId: accountId!,
      userId: body.user_id,
      role: body.role || "member",
      spendingLimit: body.spending_limit || 0,
    });

    if ("error" in result) return json({ error: result.error }, 400);
    return json(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const memberId = url.searchParams.get("member_id");
    if (!memberId) return json({ error: "member_id is required" }, 400);

    // Verify ownership
    if (user.role !== "admin") {
      const account = await getCorporateAccountByAdmin(user.id);
      if (!account) return json({ error: "No corporate account found" }, 404);

      const supabase = createAdminClient();
      const { data: member } = await supabase
        .from("corporate_members")
        .select("corporate_account_id")
        .eq("id", memberId)
        .single();

      if (!member || member.corporate_account_id !== account.id) {
        return json({ error: "Forbidden" }, 403);
      }
    }

    const result = await removeCorporateMember(memberId);
    if ("error" in result) return json({ error: result.error }, 400);
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
