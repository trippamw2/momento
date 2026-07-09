import { getUser, json, handleRouteError, parseBody, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

async function verifyOwnership(id: string, userId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (!partner) return false;
  const { data: exp } = await supabase
    .from("experiences")
    .select("partner_id")
    .eq("id", id)
    .single();
  return exp?.partner_id === partner.id;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const params2 = getQueryParams(request.url);
    const supabase = createServerClient();
    let query = supabase
      .from("experience_availability")
      .select("*")
      .eq("experience_id", id)
      .order("date")
      .order("start_time");

    if (params2.from) query = query.gte("date", params2.from);
    if (params2.to) query = query.lte("date", params2.to);
    if (params2.available === "true") query = query.eq("is_available", true);

    const { data, error } = await query;
    if (error) throw error;
    return json(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    if (user.role !== "admin" && !(await verifyOwnership(id, user.id))) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = await parseBody<{
      date: string; start_time: string; end_time: string;
      available_slots?: number; total_slots?: number; price_override?: number;
    }>(request);

    if (!body.date || !body.start_time || !body.end_time) {
      return json({ error: "date, start_time, and end_time are required" }, 400);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("experience_availability")
      .insert({
        experience_id: id,
        date: body.date,
        start_time: body.start_time,
        end_time: body.end_time,
        available_slots: body.available_slots ?? 1,
        total_slots: body.total_slots ?? 1,
        price_override: body.price_override ?? null,
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
