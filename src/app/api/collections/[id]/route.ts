import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();
    const { data: collection, error } = await admin
      .from("collections")
      .select("*, items:saved_items(id, experience_id, created_at, experience:experience_id(*))")
      .eq("id", id)
      .single();

    if (error || !collection) return json({ error: "Collection not found" }, 404);

    if (collection.user_id !== user.id && collection.is_private && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    return json(collection);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<Record<string, unknown>>(request);
    const allowedFields = ["name", "description", "is_private"];

    const filtered: Record<string, unknown> = {};
    allowedFields.forEach((f) => {
      if (body[f] !== undefined) filtered[f] = body[f];
    });
    filtered.updated_at = new Date().toISOString();

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("collections")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing) return json({ error: "Collection not found" }, 404);
    if (existing.user_id !== user.id && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    const { data, error } = await admin
      .from("collections")
      .update(filtered)
      .eq("id", id)
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("collections")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing) return json({ error: "Collection not found" }, 404);
    if (existing.user_id !== user.id && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    const { error } = await admin.from("collections").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ message: "Collection deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}
