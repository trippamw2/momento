import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ reason: string }>(request);
    if (!body.reason) return json({ error: "Reason is required" }, 400);

    const supabase = createServerClient();
    const { data: review } = await supabase
      .from("reviews")
      .select("id")
      .eq("id", id)
      .single();

    if (!review) return json({ error: "Review not found" }, 404);

    const { data: existing } = await supabase
      .from("review_flags")
      .select("id")
      .eq("review_id", id)
      .eq("flagged_by", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) return json({ error: "You have already flagged this review" }, 409);

    const admin = createAdminClient();
    const { error } = await admin
      .from("review_flags")
      .insert({ review_id: id, flagged_by: user.id, reason: body.reason });

    if (error) return json({ error: error.message }, 400);

    await admin
      .from("reviews")
      .update({ is_flagged: true, flag_reason: body.reason, updated_at: new Date().toISOString() })
      .eq("id", id);

    return json({ message: "Review flagged for moderation" });
  } catch (error) {
    return handleRouteError(error);
  }
}
