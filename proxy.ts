import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and static files
  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/experiences") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // ─── Partner API routes — require auth session ───
  if (
    pathname.startsWith("/api/partners") ||
    pathname.startsWith("/api/bookings/partner") ||
    pathname.startsWith("/api/experiences/partner")
  ) {
    const authCookie = request.cookies.get("momento-auth-token");
    if (!authCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ─── Design system — block in production ───
  if (pathname.startsWith("/design-system")) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/404", request.url));
    }
  }

  // ─── Profile page — redirect non-authenticated users to home ───
  if (pathname === "/profile") {
    const authCookie = request.cookies.get("momento-auth-token");
    if (!authCookie?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // ─── Protected API routes (require auth) ───
  const protectedApiPrefixes = [
    "/api/bookings",
    "/api/saved",
    "/api/collections",
    "/api/gift-cards",
    "/api/notifications",
    "/api/payments",
    "/api/reviews",
  ];

  const isProtected = protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (isProtected) {
    const authCookie = request.cookies.get("momento-auth-token");
    if (!authCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
