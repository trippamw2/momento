import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();
    const { data: notification } = await admin
      .from("notifications")
      .select("user_id, is_read")
      .eq("id", id)
      .single();

    if (!notification) return json({ error: "Notification not found" }, 404);
    if (notification.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    const { error } = await admin
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return json({ error: error.message }, 400);
    return json({ message: "Marked as read" });
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
    const { data: notification } = await admin
      .from("notifications")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!notification) return json({ error: "Notification not found" }, 404);
    if (notification.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    const { error } = await admin.from("notifications").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ message: "Notification deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}
