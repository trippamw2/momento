import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { badRequest, serverError, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone } = await request.json();

    if (!email || !password) return badRequest("Email and password are required");
    if (password.length < 6) return badRequest("Password must be at least 6 characters");

    const admin = createAdminClient();
    const { data: authData, error: signUpError } = await admin.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) return badRequest(signUpError.message);
    if (!authData.user) return serverError("Failed to create user");

    const { error: profileError } = await admin.from("profiles").insert({
      id: authData.user.id,
      full_name: fullName ?? null,
      phone: phone ?? null,
      role: "user",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return badRequest(profileError.message);
    }

    await admin.from("notification_preferences").insert({ user_id: authData.user.id });

    const response = NextResponse.json({ user: authData.user, session: authData.session }, { status: 201 });

    if (authData.session?.access_token) {
      response.cookies.set("experio-auth-token", authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.set("experio-user-role", "user", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
