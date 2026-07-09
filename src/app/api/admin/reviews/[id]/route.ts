import { requireAdmin, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin(request);

    const body = await parseBody<{ status?: string }>(request);
    if (!body.status || !["approved", "pending", "rejected"].includes(body.status)) {
      return json({ error: "Invalid status. Must be approved, pending, or rejected" }, 400);
    }

    const admin = createAdminClient();
    const { error } = await admin.from("reviews").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ message: "Review updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
