import { getUser, json, handleRouteError, parseBody, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const params = getQueryParams(request.url);
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = (page - 1) * limit;

    const supabase = createServerClient();
    let query = supabase
      .from("experiences")
      .select("*, partner:partner_id(business_name, business_logo, business_city), images:experience_images(url, alt, is_primary, sort_order), moods:experience_moods(mood_id, moods(id, label, emoji))", { count: "exact" });

    const user = await getUser(request);
    if (!user || user.role !== "partner") {
      query = query.eq("status", "published");
    }

    if (params.category) query = query.eq("category", params.category);
    if (params.mood) {
      query = query.contains("experience_moods.mood_id", [parseInt(params.mood)]);
    }
    if (params.partner) query = query.eq("partner_id", params.partner);
    if (params.min_price) query = query.gte("price", parseInt(params.min_price));
    if (params.max_price) query = query.lte("price", parseInt(params.max_price));
    if (params.featured === "true") query = query.eq("featured", true);
    if (params.search) {
      query = query.or(
        `title.ilike.%${params.search}%,subtitle.ilike.%${params.search}%,description.ilike.%${params.search}%,location.ilike.%${params.search}%`
      );
    }
    if (params.city) query = query.ilike("location", `%${params.city}%`);

    const sortField = params.sort ?? "created_at";
    const sortDir = params.order === "asc" ? { ascending: true } : { ascending: false };
    query = query.order(sortField as string, sortDir);
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return json({ experiences: data, total: count, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user || (user.role !== "partner" && user.role !== "admin")) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = await parseBody<Record<string, unknown>>(request);
    const required = ["title", "subtitle", "description", "price", "location", "duration", "category"];
    for (const field of required) {
      if (!body[field]) return json({ error: `${field} is required` }, 400);
    }

    const supabase = createServerClient();
    const { data: partner } = await supabase
      .from("partner_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!partner) return json({ error: "Partner profile not found" }, 400);

    const slug = (body.title as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("experiences")
      .insert({
        partner_id: partner.id,
        slug,
        title: body.title,
        subtitle: body.subtitle,
        description: body.description,
        price: body.price,
        currency: (body.currency as string) ?? "MWK",
        location: body.location,
        duration: body.duration,
        category: body.category,
        capacity: body.capacity ?? 1,
        max_guests: body.max_guests ?? 10,
        includes: body.includes ?? [],
        tags: body.tags ?? [],
        status: body.status ?? "draft",
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        cancellation_policy: body.cancellation_policy ?? "flexible",
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);

    if (body.mood_ids && Array.isArray(body.mood_ids)) {
      const moodInserts = (body.mood_ids as number[]).map((moodId: number) => ({
        experience_id: data.id,
        mood_id: moodId,
      }));
      await admin.from("experience_moods").insert(moodInserts);
    }

    if (body.images && Array.isArray(body.images)) {
      const imageInserts = (body.images as { url: string; alt?: string; is_primary?: boolean }[])
        .map((img, i) => ({
          experience_id: data.id,
          url: img.url,
          alt: img.alt ?? null,
          is_primary: img.is_primary ?? (i === 0),
          sort_order: i,
        }));
      await admin.from("experience_images").insert(imageInserts);
    }

    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
