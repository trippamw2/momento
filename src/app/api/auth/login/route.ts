import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { badRequest, unauthorized, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return badRequest("Email and password are required");

    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed")) {
        return NextResponse.json(
          { error: "Please confirm your email address first. Check your inbox (and spam folder).", code: "email_not_confirmed" },
          { status: 401 }
        );
      }
      if (msg.includes("invalid login credentials")) {
        return unauthorized("Incorrect email or password. Try again.");
      }
      return unauthorized(error.message);
    }

    // Query the users table for the correct role (bypass RLS with admin client)
    let role = "user";
    if (data.user) {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();
      role = profile?.role ?? data.user.user_metadata?.role ?? "user";
    }

    const response = NextResponse.json({ user: data.user, session: data.session, role });

    if (data.session?.access_token) {
      response.cookies.set("experio-auth-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.set("experio-user-role", role, {
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
