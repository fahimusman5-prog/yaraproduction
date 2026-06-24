import "server-only";

import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) throw new Error("Supabase server credentials are not configured.");
  client ??= createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
