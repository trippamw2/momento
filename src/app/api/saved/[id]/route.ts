import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ collection_id?: string | null }>(request);

    const admin = createAdminClient();
    const { data: item } = await admin
      .from("saved_items")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!item) return json({ error: "Saved item not found" }, 404);
    if (item.user_id !== user.id && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    // If collection_id is null, remove from collection
    // If collection_id is provided, verify it exists and belongs to user
    if (body.collection_id) {
      const { data: collection } = await admin
        .from("collections")
        .select("id")
        .eq("id", body.collection_id)
        .eq("user_id", user.id)
        .single();

      if (!collection) return json({ error: "Collection not found" }, 404);
    }

    const { data, error } = await admin
      .from("saved_items")
      .update({ collection_id: body.collection_id ?? null })
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
    const { data: item } = await admin
      .from("saved_items")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!item) return json({ error: "Saved item not found" }, 404);
    if (item.user_id !== user.id && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    const { error } = await admin.from("saved_items").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ message: "Removed from saved" });
  } catch (error) {
    return handleRouteError(error);
  }
}
