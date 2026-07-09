import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("platform_settings")
      .select("*")
      .order("key");

    if (error) throw error;
    return json({ settings: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const body = await request.json() as { key: string; value: string };
    if (!body.key || body.value === undefined) {
      return json({ error: "key and value are required" }, 400);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("platform_settings")
      .update({ value: body.value, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("key", body.key)
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
