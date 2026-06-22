import { getUser, json, unauthorized, handleRouteError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();

    const { createServerClient } = await import("@/lib/supabase-server");
    const supabase = createServerClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: partner } = await supabase
      .from("partner_profiles")
      .select("id, business_name, verification_status")
      .eq("user_id", user.id)
      .maybeSingle();

    return json({ ...user, profile, partnerProfile: partner ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}
