import { createServerClient } from "@/lib/supabase-server";
import { json, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ message: "Already logged out" });

    const supabase = createServerClient();
    await supabase.auth.admin.signOut(token);

    return json({ message: "Logged out successfully" });
  } catch (error) {
    return handleRouteError(error);
  }
}
