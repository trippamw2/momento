import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getUser, unauthorized, badRequest, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return badRequest("No file provided");
    if (!file.type.startsWith("image/")) return badRequest("File must be an image");
    if (file.size > 5 * 1024 * 1024) return badRequest("File must be under 5MB");

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `avatars/${user.id}/${Date.now()}.${ext}`;

    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await admin.storage
      .from("momento-assets")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) return badRequest(error.message);

    const { data: urlData } = admin.storage
      .from("momento-assets")
      .getPublicUrl(fileName);

    // Update user's avatar_url in the users table
    const { error: updateError } = await admin
      .from("users")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id);

    if (updateError) return badRequest(updateError.message);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    return handleRouteError(error);
  }
}
