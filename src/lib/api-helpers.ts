import { NextResponse } from "next/server";
import { createServerClient } from "./supabase-server";
import { createAdminClient } from "./supabase-admin";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message = "Conflict") {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export interface AuthUser {
  id: string;
  email: string;
  role: "user" | "partner" | "admin";
}

export async function getUser(request: Request): Promise<AuthUser | null> {
  const supabase = createServerClient();
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Use admin client to bypass RLS on the users table
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile?.role ?? user.user_metadata?.role ?? "user",
  };
}

export async function requireUser(request: Request): Promise<AuthUser> {
  const user = await getUser(request);
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(request: Request, role: AuthUser["role"]): Promise<AuthUser> {
  const user = await requireUser(request);
  if (user.role !== role) throw new ForbiddenError();
  return user;
}

export async function requireAdmin(request: Request): Promise<AuthUser> {
  return requireRole(request, "admin");
}

export async function requirePartner(request: Request): Promise<AuthUser> {
  return requireRole(request, "partner");
}

export class UnauthorizedError extends Error {
  constructor() { super("Unauthorized"); }
}

export class ForbiddenError extends Error {
  constructor() { super("Forbidden"); }
}

export class NotFoundError extends Error {
  constructor(msg = "Not found") { super(msg); }
}

export class BadRequestError extends Error {
  constructor(msg = "Bad request") { super(msg); }
}

export class ConflictError extends Error {
  constructor(msg = "Conflict") { super(msg); }
}

export function handleRouteError(error: unknown) {
  if (error instanceof UnauthorizedError) return unauthorized(error.message);
  if (error instanceof ForbiddenError) return forbidden(error.message);
  if (error instanceof NotFoundError) return notFound(error.message);
  if (error instanceof BadRequestError) return badRequest(error.message);
  if (error instanceof ConflictError) return conflict(error.message);
  return serverError(error);
}

export function parseBody<T>(request: Request): Promise<T> {
  return request.json();
}

export function getQueryParams(url: string): Record<string, string> {
  const params = new URL(url).searchParams;
  const result: Record<string, string> = {};
  params.forEach((value, key) => { result[key] = value; });
  return result;
}
