import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createServerClient();
    const { data: prefs, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return json(prefs ?? { user_id: user.id });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<Record<string, unknown>>(request);
    const allowedFields = [
      "email_bookings", "email_promotions", "email_reviews",
      "push_bookings", "push_promotions", "push_reviews",
      "sms_bookings", "sms_promotions",
    ];

    const filtered: Record<string, unknown> = {};
    allowedFields.forEach((f) => {
      if (body[f] !== undefined) filtered[f] = body[f];
    });
    filtered.updated_at = new Date().toISOString();

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("notification_preferences")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await admin
        .from("notification_preferences")
        .update(filtered)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      result = data;
    } else {
      const { data, error } = await admin
        .from("notification_preferences")
        .insert({ user_id: user.id, ...filtered })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      result = data;
    }

    return json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
