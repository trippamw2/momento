import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ current_password?: string; new_password: string }>(request);

    if (!body.new_password || body.new_password.length < 6) {
      return json({ error: "New password must be at least 6 characters" }, 400);
    }

    const admin = createAdminClient();

    // Use Supabase admin API to update password (bypasses requiring re-authentication)
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: body.new_password,
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    return json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return handleRouteError(error);
  }
}
