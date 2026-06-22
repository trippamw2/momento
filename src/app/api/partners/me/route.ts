import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createServerClient();
    const { data: partner, error } = await supabase
      .from("partner_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!partner) return json({ partner: null });

      const { count: experienceCount } = await supabase
        .from("experiences")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partner.id);

      const { data: partnerExperiences } = await supabase
        .from("experiences")
        .select("id")
        .eq("partner_id", partner.id);

      const expIds = (partnerExperiences ?? []).map((e) => e.id);
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("experience_id", expIds.length > 0 ? expIds : ["none"]);

      return json({ ...partner, stats: { experiences: experienceCount ?? 0, bookings: bookingCount ?? 0 } });
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
      "business_name", "business_description", "business_logo", "business_cover",
      "business_email", "business_phone", "business_website", "business_address",
      "business_city", "business_country", "categories", "payout_method", "payout_details",
    ];

    const filtered: Record<string, unknown> = {};
    allowedFields.forEach((f) => {
      if (body[f] !== undefined) filtered[f] = body[f];
    });
    filtered.updated_at = new Date().toISOString();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("partner_profiles")
      .update(filtered)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
