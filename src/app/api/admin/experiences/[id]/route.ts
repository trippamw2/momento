import { requireAdmin, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin(request);

    const body = await parseBody<{ status?: string; featured?: boolean }>(request);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.status && ["draft", "published", "archived", "paused"].includes(body.status)) {
      updates.status = body.status;
    }
    if (body.featured !== undefined) {
      updates.featured = body.featured;
    }

    const admin = createAdminClient();
    const { data, error } = await admin.from("experiences").update(updates).eq("id", id).select().single();
    if (error) return json({ error: error.message }, 400);
    return json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
