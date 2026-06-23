import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { json, handleRouteError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) {
      const supabase = createServerClient();
      await supabase.auth.admin.signOut(token);
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    response.cookies.set("momento-auth-token", "", { path: "/", maxAge: 0 });
    response.cookies.set("momento-user-role", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
