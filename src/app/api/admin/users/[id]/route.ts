import { requireAdmin, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin(request);

    const body = await parseBody<{ role?: string }>(request);
    if (!body.role || !["user", "partner", "admin"].includes(body.role)) {
      return json({ error: "Invalid role. Must be user, partner, or admin" }, 400);
    }

    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ role: body.role }).eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ message: "Role updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
