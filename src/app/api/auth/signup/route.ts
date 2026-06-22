import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { json, badRequest, serverError, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone } = await request.json();

    if (!email || !password) return badRequest("Email and password are required");
    if (password.length < 6) return badRequest("Password must be at least 6 characters");

    const supabase = createServerClient();
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) return badRequest(signUpError.message);
    if (!authData.user) return serverError("Failed to create user");

    const admin = createAdminClient();
    const { error: profileError } = await admin.from("profiles").insert({
      id: authData.user.id,
      full_name: fullName ?? null,
      phone: phone ?? null,
      role: "user",
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return badRequest(profileError.message);
    }

    await admin.from("notification_preferences").insert({ user_id: authData.user.id });

    return json({ user: authData.user, session: authData.session }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
