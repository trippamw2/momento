import { requireAdmin, getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user || (user.role !== "admin" && user.id !== id)) {
      return json({ error: "Forbidden" }, 403);
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !profile) return json({ error: "User not found" }, 404);

    const { data: partner } = await admin
      .from("partner_profiles")
      .select("id, business_name, verification_status")
      .eq("user_id", id)
      .maybeSingle();

    return json({ ...profile, partnerProfile: partner ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user || (user.role !== "admin" && user.id !== id)) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = await parseBody<Record<string, unknown>>(request);
    const allowedFields = ["full_name", "avatar_url", "phone", "country", "city", "preferences"];

    if (user.role !== "admin") {
      Object.keys(body).forEach((k) => {
        if (!allowedFields.includes(k)) delete body[k];
      });
    }

    body.updated_at = new Date().toISOString();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .update(body)
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
    await requireAdmin(request);

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return json({ error: error.message }, 400);

    return json({ message: "User deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}
