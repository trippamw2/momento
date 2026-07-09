import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ response: string }>(request);
    if (!body.response) return json({ error: "Response text is required" }, 400);

    const supabase = createServerClient();
    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!partner && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: review } = await supabase
      .from("reviews")
      .select("id, experience_id")
      .eq("id", id)
      .single();

    if (!review) return json({ error: "Review not found" }, 404);

    if (user.role !== "admin") {
      const { data: experience } = await supabase
        .from("experiences")
        .select("partner_id")
        .eq("id", review.experience_id)
        .single();

      if (!experience || experience.partner_id !== partner!.id) {
        return json({ error: "Forbidden" }, 403);
      }
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("reviews")
      .update({
        partner_response: body.response,
        partner_responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return json({ error: error.message }, 400);
    return json({ message: "Response added" });
  } catch (error) {
    return handleRouteError(error);
  }
}
