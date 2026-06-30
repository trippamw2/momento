import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: experience, error } = await supabase
      .from("experiences")
      .select("*, partner:partner_id(business_name, business_logo, business_description, cities, business_phone, business_email), images:experience_images(url, alt, is_primary, sort_order), moods:experience_moods(mood_id, moods(id, label, emoji))")
      .eq("id", id)
      .single();

    if (error || !experience) return json({ error: "Experience not found" }, 404);

    const { data: availability } = await supabase
      .from("experience_availability")
      .select("*")
      .eq("experience_id", id)
      .eq("is_available", true)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date")
      .order("start_time");

    const { data: reviews } = await supabase
      .from("reviews")
      .select("*, user:user_id(full_name, avatar_url)")
      .eq("experience_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);

    const city = ["Cape Maclear", "Lilongwe", "Salima", "Blantyre", "Mangochi", "Zomba", "Dedza", "Liwonde", "Nkhotakota", "Mzuzu"].includes(experience.location)
      ? (experience.location === "Cape Maclear" || experience.location === "Salima" || experience.location === "Dedza" || experience.location === "Liwonde" || experience.location === "Nkhotakota" ? "Lilongwe"
        : experience.location === "Zomba" || experience.location === "Mangochi" ? "Blantyre"
        : experience.location)
      : "Lilongwe";

    return json({ ...experience, city, availability: availability ?? [], reviews: reviews ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<Record<string, unknown>>(request);
    const allowedFields = [
      "title", "subtitle", "description", "price", "currency", "location",
      "latitude", "longitude", "duration", "duration_minutes", "capacity",
      "max_guests", "includes", "what_to_bring", "requirements", "category",
      "tags", "status", "featured", "cancellation_policy",
    ];

    const filtered: Record<string, unknown> = {};
    allowedFields.forEach((f) => {
      if (body[f] !== undefined) filtered[f] = body[f];
    });
    filtered.updated_at = new Date().toISOString();

    const supabase = createServerClient();

    if (user.role !== "admin") {
      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!partner) return json({ error: "Forbidden" }, 403);

      const { data: exp } = await supabase
        .from("experiences")
        .select("partner_id")
        .eq("id", id)
        .single();

      if (!exp || exp.partner_id !== partner.id) return json({ error: "Forbidden" }, 403);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("experiences")
      .update(filtered)
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
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createServerClient();

    if (user.role !== "admin") {
      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!partner) return json({ error: "Forbidden" }, 403);

      const { data: exp } = await supabase
        .from("experiences")
        .select("partner_id")
        .eq("id", id)
        .single();

      if (!exp || exp.partner_id !== partner.id) return json({ error: "Forbidden" }, 403);
    }

    const admin = createAdminClient();
    const { error } = await admin.from("experiences").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);

    return json({ message: "Experience deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}
