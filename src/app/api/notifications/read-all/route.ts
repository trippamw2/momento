import { json, getUser, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * POST /api/notifications/read-all
 * Mark all of the authenticated user's notifications as read.
 */
export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();
    const { error } = await admin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) return json({ error: error.message }, 400);

    return json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
