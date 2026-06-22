import { createServerClient } from "@/lib/supabase-server";
import { json, badRequest, unauthorized, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) return badRequest("Refresh token is required");

    const supabase = createServerClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) return unauthorized(error.message);

    return json({ session: data.session, user: data.user });
  } catch (error) {
    return handleRouteError(error);
  }
}
