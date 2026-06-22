import { json, handleRouteError } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: partner, error } = await supabase
      .from("partner_profiles")
      .select("*, user:user_id(id, full_name, avatar_url)")
      .eq("id", id)
      .single();

    if (error || !partner) return json({ error: "Partner not found" }, 404);

    const { data: experiences } = await supabase
      .from("experiences")
      .select("id, title, slug, price, currency, duration, rating, review_count, status, category")
      .eq("partner_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    return json({ ...partner, experiences: experiences ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
