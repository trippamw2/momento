import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Anonymous server client — use ONLY for public/unauthenticated reads.
 * For authenticated data access after getUser(), use createAdminClient()
 * from supabase-admin.ts (bypasses RLS, but auth is already validated).
 */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
