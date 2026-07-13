import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const { id } = await params;
    const body = await request.json() as { status: string; notes?: string };
    const allowedStatuses = ["pending", "approved", "processing", "completed", "rejected"];
    if (!allowedStatuses.includes(body.status)) {
      return json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` }, 400);
    }

    const admin = createAdminClient();

    // If completing a payout, first fetch it to get partner_id and amount
    let payoutRecord: { id: string; partner_id: string; amount: number; status: string } | null = null;
    if (body.status === "completed") {
      const { data: existing } = await admin
        .from("payouts")
        .select("id, partner_id, amount, status")
        .eq("id", id)
        .single();

      if (!existing) return json({ error: "Payout not found" }, 404);
      if (existing.status !== "approved" && existing.status !== "processing") {
        return json({ error: "Payout must be approved or processing before marking completed" }, 400);
      }
      payoutRecord = existing;
    }

    const updateData: Record<string, unknown> = {
      status: body.status,
      notes: body.notes ?? undefined,
      updated_at: new Date().toISOString(),
    };

    if (body.status === "completed" || body.status === "rejected") {
      updateData.processed_by = user.id;
      updateData.processed_at = new Date().toISOString();
    }

    const { data, error } = await admin
      .from("payouts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Payout not found" }, 404);

    // Mark corresponding partner_earnings as "withdrawn" when payout is completed
    if (body.status === "completed" && payoutRecord) {
      const { partner_id, amount } = payoutRecord;

      // Get all "available" earnings for this partner, oldest first
      const { data: earnings } = await admin
        .from("partner_earnings")
        .select("id, net_amount")
        .eq("partner_id", partner_id)
        .eq("status", "available")
        .order("created_at", { ascending: true });

      if (earnings && earnings.length > 0) {
        let remaining = amount;
        const toWithdraw: string[] = [];

        for (const earning of earnings) {
          if (remaining <= 0) break;
          toWithdraw.push(earning.id);
          remaining -= earning.net_amount;
        }

        // Mark selected earnings as withdrawn
        if (toWithdraw.length > 0) {
          await admin
            .from("partner_earnings")
            .update({ status: "withdrawn" })
            .in("id", toWithdraw);
        }
      }
    }

    return json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
