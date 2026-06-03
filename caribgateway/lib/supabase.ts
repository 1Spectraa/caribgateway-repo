/**
 * lib/supabase.ts
 *
 * Supabase client factory.
 *
 * SETUP: Add the following variables to your .env.local (and Vercel project):
 *   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   ← server-only, never expose
 *
 * Usage:
 *   import { createBrowserClient } from "@/lib/supabase";
 *   const supabase = createBrowserClient();
 *   const { data } = await supabase.from("businesses").select("*");
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ---------------------------------------------------------------------------
// Browser / public client
// Uses the anon key — subject to Row Level Security policies.
// Safe to instantiate in client components.
// ---------------------------------------------------------------------------
export function createBrowserClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// ---------------------------------------------------------------------------
// Server / admin client
// Uses the service-role key — bypasses RLS.
// ONLY use in Server Actions and Route Handlers; never expose to the browser.
// ---------------------------------------------------------------------------
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Public server client
// Uses the anon key — subject to Row Level Security policies.
// Safe to use in public Server Components; never persists session data.
// ---------------------------------------------------------------------------
export function createPublicServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
