import { getUser, json, handleRouteError } from "@/lib/api-helpers";
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

    // Total earned
    const { data: allEarnings } = await admin
      .from("partner_earnings")
      .select("net_amount, status")
      .eq("partner_id", partner.id);

    const totalEarned = (allEarnings ?? []).reduce((sum: number, e: { net_amount: number }) => sum + e.net_amount, 0);
    const availableBalance = (allEarnings ?? [])
      .filter((e: { status: string }) => e.status === "available")
      .reduce((sum: number, e: { net_amount: number }) => sum + e.net_amount, 0);
    const withdrawn = (allEarnings ?? [])
      .filter((e: { status: string }) => e.status === "withdrawn")
      .reduce((sum: number, e: { net_amount: number }) => sum + e.net_amount, 0);

    // Pending payouts
    const { data: pendingPayouts } = await admin
      .from("payouts")
      .select("amount")
      .eq("partner_id", partner.id)
      .in("status", ["pending", "approved", "processing"]);

    const pendingPayoutAmount = (pendingPayouts ?? []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

    // Recent earnings (last 10)
    const { data: recentEarnings } = await admin
      .from("partner_earnings")
      .select("*, experience:experience_id(title)")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return json({
      total_earned: totalEarned,
      available_balance: availableBalance,
      withdrawn,
      pending_payouts: pendingPayoutAmount,
      recent_earnings: recentEarnings ?? [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
