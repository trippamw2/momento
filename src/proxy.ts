import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const protectedPaths = [
  "/api/bookings",
  "/api/gift-cards",
  "/api/payments",
  "/api/saved",
  "/api/collections",
  "/api/notifications",
  "/api/reviews",
  "/api/loyalty",
  "/api/users",
];

const partnerPaths = [
  "/api/experiences/partner",
  "/api/bookings/partner",
  "/api/analytics",
  "/api/partners",
];

const adminPaths = [
  "/api/admin",
];

const adminPagePaths = [
  "/admin",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isPartnerRoute = partnerPaths.some((p) => pathname.startsWith(p));
  const isAdminRoute = adminPaths.some((p) => pathname.startsWith(p));
  const isAdminPage = adminPagePaths.some((p) => pathname.startsWith(p));

  // Admin page routes â€” redirect to home if not admin
  if (isAdminPage) {
    const authCookie = request.cookies.get("experio-auth-token");
    const roleCookie = request.cookies.get("experio-user-role");
    if (!authCookie?.value || roleCookie?.value !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (!isProtected && !isPartnerRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.headers.get("Authorization")?.replace("Bearer ", "") 
    || request.cookies.get("experio-auth-token")?.value;
    
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdminRoute || isAdminPage || isPartnerRoute) {
    // Use admin client to bypass RLS on the users view
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if ((isAdminRoute || isAdminPage) && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isPartnerRoute && profile?.role !== "partner" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
