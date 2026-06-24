import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { badRequest, unauthorized, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return badRequest("Email and password are required");

    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return unauthorized(error.message);

    const response = NextResponse.json({ user: data.user, session: data.session });

    if (data.session?.access_token) {
      response.cookies.set("experio-auth-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      response.cookies.set("experio-user-role", data.user?.user_metadata?.role || "user", {
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
