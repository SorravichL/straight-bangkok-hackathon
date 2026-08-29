// Server-only Supabase client.
//
// This module reads SUPABASE_SERVICE_ROLE_KEY, which bypasses Row Level Security.
// Only import it from route handlers / server components — never from a "use client"
// file. Next.js only inlines env vars prefixed with NEXT_PUBLIC_ into the browser
// bundle, so the key stays on the server as long as that rule is respected.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in " +
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then restart `npm run dev`."
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
