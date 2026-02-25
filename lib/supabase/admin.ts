import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with service role key.
 * Bypasses RLS – use only in API routes or server code for dashboard/admin.
 * Set SUPABASE_SERVICE_ROLE_KEY in .env.local (from Supabase: Project Settings → API → service_role).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
