import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { badRequest, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return badRequest("Email is required");

    const supabase = createServerClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    });

    if (error) return badRequest(error.message);

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
