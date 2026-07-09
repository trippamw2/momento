import { getUser, json, unauthorized, badRequest, handleRouteError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();

    const { createServerClient } = await import("@/lib/supabase-server");
    const supabase = createServerClient();

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: partner } = await supabase
      .from("partners")
      .select("id, business_name, verification_status")
      .eq("user_id", user.id)
      .maybeSingle();

    return json({ ...user, profile, partnerProfile: partner ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();

    const { full_name, phone } = await request.json();

    const { createServerClient } = await import("@/lib/supabase-server");
    const supabase = createServerClient();

    const updates: Record<string, unknown> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return badRequest("No fields to update");
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) return badRequest(error.message);

    return json({ profile: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
