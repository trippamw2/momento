import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { json, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) {
      const admin = createAdminClient();
      await admin.auth.admin.signOut(token);
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    response.cookies.set("experio-auth-token", "", { path: "/", maxAge: 0 });
    response.cookies.set("experio-user-role", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
