import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { badRequest, serverError, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { email, password, full_name, phone, role, avatar_url } = await request.json();

    if (!email || !password) return badRequest("Email and password are required");
    if (password.length < 6) return badRequest("Password must be at least 6 characters");

    const validatedRole: "user" | "partner" = (role === "partner") ? "partner" : "user";

    const admin = createAdminClient();
    const { data: authData, error: signUpError } = await admin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: validatedRole,
          phone: phone ?? null,
        },
      },
    });

    if (signUpError) return badRequest(signUpError.message);
    if (!authData.user) return serverError("Failed to create user");

    // Insert into users table
    const { error: profileError } = await admin.from("users").insert({
      id: authData.user.id,
      email: authData.user.email ?? email,
      full_name: full_name ?? null,
      phone: phone ?? null,
      avatar_url: avatar_url ?? null,
      role: validatedRole,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return badRequest(profileError.message);
    }

    // If role is partner, create partner profile
    if (validatedRole === "partner") {
      const partnerBusinessName = full_name
        ? `${full_name}'s Experiences`
        : "New Partner";

      const { error: partnerError } = await admin.from("partners").insert({
        user_id: authData.user.id,
        business_name: partnerBusinessName,
        business_logo: avatar_url ?? null,
        business_email: email,
        verification_status: "pending",
        is_active: false,
      });

      if (partnerError) {
        // Non-blocking: log but don't fail the signup
        console.error("Failed to create partner profile:", partnerError);
      }
    }

    // Create notification preferences
    try {
      await admin.from("notification_preferences").insert({ user_id: authData.user.id });
    } catch {
      // non-blocking
    }

    const response = NextResponse.json(
      { user: authData.user, session: authData.session },
      { status: 201 }
    );

    if (authData.session?.access_token) {
      response.cookies.set("experio-auth-token", authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.set("experio-user-role", validatedRole, {
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
