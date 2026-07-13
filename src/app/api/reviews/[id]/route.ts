import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data: review, error } = await admin
      .from("reviews")
      .select("*, user:user_id(full_name, avatar_url), experience:experience_id(title, slug)")
      .eq("id", id)
      .single();

    if (error || !review) return json({ error: "Review not found" }, 404);

    const user = await getUser(request);
    if (review.status !== "approved" && review.user_id !== user?.id && user?.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    return json(review);
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
    const admin = createAdminClient();

    const { data: review } = await admin
      .from("reviews")
      .select("user_id, experience_id")
      .eq("id", id)
      .single();

    if (!review) return json({ error: "Review not found" }, 404);

    const isOwner = review.user_id === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      const admin2 = createAdminClient();
      const { data: partner } = await admin2
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (partner) {
        const { data: exp } = await admin2
          .from("experiences")
          .select("partner_id")
          .eq("id", review.experience_id)
          .single();
        if (exp?.partner_id !== partner.id) return json({ error: "Forbidden" }, 403);
      } else {
        return json({ error: "Forbidden" }, 403);
      }
    }

    const allowedFields = isOwner ? ["title", "body", "rating", "images"] : ["status"];
    if (isAdmin) allowedFields.push("status", "is_flagged", "flag_reason");

    const filtered: Record<string, unknown> = {};
    allowedFields.forEach((f) => {
      if (body[f] !== undefined) filtered[f] = body[f];
    });

    if (Object.keys(filtered).length === 0) return json({ error: "No valid fields to update" }, 400);
    filtered.updated_at = new Date().toISOString();

    const { data, error } = await admin
      .from("reviews")
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

    const admin = createAdminClient();
    const { data: review } = await admin
      .from("reviews")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!review) return json({ error: "Review not found" }, 404);

    if (review.user_id !== user.id && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    const { error } = await admin.from("reviews").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ message: "Review deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}
