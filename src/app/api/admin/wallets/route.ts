import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { getAllWallets } from "@/lib/wallet-engine";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20")));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0"));
    const status = url.searchParams.get("status") || undefined;
    const minBalance = url.searchParams.get("min_balance") ? parseInt(url.searchParams.get("min_balance")!) : undefined;

    const result = await getAllWallets({ limit, offset, status, minBalance });

    // Enrich with user details
    const admin = createAdminClient();
    const userIds = result.wallets.map((w) => w.userId);
    const { data: userProfiles } = await admin
      .from("users")
      .select("id, email, full_name, phone")
      .in("id", userIds.length ? userIds : ["none"]);

    const userMap = new Map((userProfiles || []).map((p: Record<string, unknown>) => [String(p.id), p]));

    const enriched = result.wallets.map((w) => ({
      ...w,
      user: userMap.get(w.userId) || null,
    }));

    // Aggregate stats
    const totalBalance = result.wallets.reduce((sum, w) => sum + w.balance, 0);
    const activeWallets = result.wallets.filter((w) => w.status === "active").length;
    const frozenWallets = result.wallets.filter((w) => w.status === "frozen").length;

    return json({
      wallets: enriched,
      total: result.total,
      stats: {
        totalWallets: result.total,
        activeWallets,
        frozenWallets,
        totalBalance,
      },
      limit,
      offset,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
