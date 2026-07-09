import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerClient } from "@/lib/supabase-server";
import { badRequest, serverError, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { email, password, full_name, phone, role, avatar_url, birthdate } = await request.json();

    if (!email || !password) return badRequest("Email and password are required");
    if (password.length < 6) return badRequest("Password must be at least 6 characters");
    if (birthdate && isNaN(Date.parse(birthdate))) return badRequest("Invalid birthdate format");

    const validatedRole: "user" | "partner" = role === "partner" ? "partner" : "user";

    // Step 1: Create user in Supabase Auth (bypass email confirmation)
    const admin = createAdminClient();
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: validatedRole, phone },
    });

    if (createError) return badRequest(createError.message);
    if (!createData.user) return serverError("Failed to create user");

    // Step 2: Insert into profiles table (matches schema.sql)
    const { error: profileError } = await admin.from("profiles").insert({
      id: createData.user.id,
      role: validatedRole,
      full_name: full_name ?? null,
      phone: phone ?? null,
      avatar_url: avatar_url ?? null,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(createData.user.id);
      return badRequest(profileError.message);
    }

    // Step 3: If partner, create partner profile (matches schema: partner_profiles)
    if (validatedRole === "partner") {
      const { error: partnerError } = await admin.from("partner_profiles").insert({
        user_id: createData.user.id,
        business_name: full_name ? `${full_name}'s Experiences` : "New Partner",
        business_logo: avatar_url ?? null,
        business_email: email,
        verification_status: "pending",
        is_active: false,
      });

      if (partnerError) {
        console.error("Failed to create partner profile:", partnerError);
      }
    }

    // Step 4: Create notification preferences (non-blocking)
    try {
      await admin.from("notification_preferences").insert({ user_id: createData.user.id });
    } catch {
      // table may not exist
    }

    // Step 5: Sign in with the same credentials to get a session
    const server = createServerClient();
    const { data: signIn, error: signInError } = await server.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signIn.session) {
      // User was created but we can't log them in — tell them to sign in manually
      return NextResponse.json(
        { user: createData.user, session: null, message: "Account created. Please sign in." },
        { status: 201 }
      );
    }

    // Step 6: Set auth cookies and return session
    const response = NextResponse.json(
      { user: signIn.user, session: signIn.session, created: true },
      { status: 201 }
    );

    response.cookies.set("experio-auth-token", signIn.session.access_token, {
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

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
