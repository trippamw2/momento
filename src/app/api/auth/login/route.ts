import { createServerClient } from "@/lib/supabase-server";
import { json, badRequest, unauthorized, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return badRequest("Email and password are required");

    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return unauthorized(error.message);

    return json({ user: data.user, session: data.session });
  } catch (error) {
    return handleRouteError(error);
  }
}
