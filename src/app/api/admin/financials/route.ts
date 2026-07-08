import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const period = params.period ?? "30d";

    const admin = createAdminClient();

    // Get total revenue
    const { data: payments } = await admin
      .from("payments")
      .select("amount, status, created_at")
      .eq("status", "succeeded");

    const totalRevenue = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);

    // Get monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthPayments = (payments ?? []).filter((p) => {
        const paymentDate = new Date(p.created_at);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });

      monthlyRevenue.unshift({
        month: monthDate.toLocaleString("en-US", { month: "short" }),
        amount: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      });
    }

    // Get pending payments
    const { data: pendingPayments } = await admin
      .from("payments")
      .select("amount")
      .eq("status", "pending");

    const pendingPayouts = (pendingPayments ?? []).reduce((sum, p) => sum + p.amount, 0);

    // Get refunded payments
    const { data: refundedPayments } = await admin
      .from("payments")
      .select("amount")
      .eq("status", "refunded");

    const refundedAmount = (refundedPayments ?? []).reduce((sum, p) => sum + p.amount, 0);

    // Platform fee (10%)
    const platformFee = totalRevenue * 0.1;

    return json({
      totalRevenue,
      monthlyRevenue,
      pendingPayouts,
      completedPayouts: totalRevenue - pendingPayouts - refundedAmount,
      platformFee,
      refundedAmount,
      period,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
