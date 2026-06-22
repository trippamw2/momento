import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

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
