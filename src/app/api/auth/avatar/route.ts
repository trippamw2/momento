import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) return json({ error: "No file provided" }, 400);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return json({ error: "File must be an image" }, 400);
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return json({ error: "File must be under 2MB" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "png";
    const fileName = `avatars/${user.id}-${Date.now()}.${ext}`;

    const admin = createAdminClient();

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await admin.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      // If bucket doesn't exist, create it
      if (uploadError.message?.includes("bucket")) {
        const { error: bucketError } = await admin.storage.createBucket("avatars", {
          public: true,
        });
        if (bucketError) return json({ error: "Storage not configured" }, 500);

        // Retry upload
        const { error: retryError } = await admin.storage
          .from("avatars")
          .upload(fileName, buffer, { contentType: file.type, upsert: true });
        if (retryError) return json({ error: retryError.message }, 500);
      } else {
        return json({ error: uploadError.message }, 500);
      }
    }

    // Get public URL
    const { data: urlData } = admin.storage.from("avatars").getPublicUrl(fileName);
    const avatarUrl = urlData?.publicUrl || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;

    // Update profile avatar_url
    const { error: updateError } = await admin
      .from("users")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) return json({ error: updateError.message }, 500);

    return json({ avatar_url: avatarUrl });
  } catch (error) {
    return handleRouteError(error);
  }
}
