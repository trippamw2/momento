import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
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
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("experience_images")
      .select("*")
      .eq("experience_id", id)
      .order("sort_order");

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

    const body = await parseBody<{ url: string; alt?: string; is_primary?: boolean }>(request);
    if (!body.url) return json({ error: "url is required" }, 400);

    const admin = createAdminClient();
    const { data: images } = await admin
      .from("experience_images")
      .select("id")
      .eq("experience_id", id);

    const sortOrder = (images ?? []).length;

    const { data, error } = await admin
      .from("experience_images")
      .insert({
        experience_id: id,
        url: body.url,
        alt: body.alt ?? null,
        is_primary: body.is_primary ?? (sortOrder === 0),
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const imageId = url.searchParams.get("image_id");
    if (!imageId) return json({ error: "image_id query param required" }, 400);

    if (user.role !== "admin" && !(await verifyOwnership(id, user.id))) {
      return json({ error: "Forbidden" }, 403);
    }

    const admin = createAdminClient();
    const { error } = await admin.from("experience_images").delete().eq("id", imageId).eq("experience_id", id);
    if (error) return json({ error: error.message }, 400);

    return json({ message: "Image deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}
