import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import {
  createCorporateAccount,
  getCorporateAccountByAdmin,
  listCorporateAccounts,
} from "@/lib/corporate-engine";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const isAdminRequest = url.searchParams.get("admin") === "true";

    if (isAdminRequest && user.role === "admin") {
      // Admin: list all corporate accounts
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20")));
      const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0"));
      const status = url.searchParams.get("status") || undefined;
      const result = await listCorporateAccounts({ limit, offset, status });

      // Enrich with admin names
      const adminIds = result.accounts.map((a) => a.adminId);
      const supabase = createAdminClient();
      const { data: admins } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", adminIds.length ? adminIds : ["none"]);
      const adminMap = new Map((admins || []).map((a: Record<string, unknown>) => [String(a.id), a]));

      const enriched = result.accounts.map((a) => ({
        ...a,
        admin: adminMap.get(a.adminId) || null,
      }));

      return json({ accounts: enriched, total: result.total, limit, offset });
    }

    // Corporate admin: get their own account
    const account = await getCorporateAccountByAdmin(user.id);
    if (!account) return json({ account: null });

    // Fetch members count
    const supabase = createAdminClient();
    const { count: memberCount } = await supabase
      .from("corporate_members")
      .select("*", { count: "exact", head: true })
      .eq("corporate_account_id", account.id);

    return json({ account, memberCount: memberCount ?? 0 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await request.json();

    // Check if user already has a corporate account
    const existing = await getCorporateAccountByAdmin(user.id);
    if (existing) return json({ error: "You already have a corporate account" }, 409);

    const result = await createCorporateAccount({
      companyName: body.company_name || body.companyName,
      companyEmail: body.company_email || body.companyEmail,
      companyRegistration: body.company_registration || body.companyRegistration,
      companyPhone: body.company_phone || body.companyPhone,
      companyAddress: body.company_address || body.companyAddress,
      adminId: user.id,
      creditLimit: body.credit_limit || body.creditLimit,
      spendingLimitDaily: body.spending_limit_daily || body.spendingLimitDaily,
      spendingLimitMonthly: body.spending_limit_monthly || body.spendingLimitMonthly,
      requiresApproval: body.requires_approval ?? body.requiresApproval ?? true,
      approvalThreshold: body.approval_threshold || body.approvalThreshold || 100000,
    });

    if ("error" in result) return json({ error: result.error }, 400);
    return json(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
