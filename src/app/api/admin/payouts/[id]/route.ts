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
    return json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
