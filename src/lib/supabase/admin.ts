import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfigIssues } from "./env";

type AdminTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

type AdminDatabase = {
  public: {
    Tables: Record<string, AdminTable>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

let client: SupabaseClient<AdminDatabase> | null = null;

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) {
    console.error("[supabase:admin] Missing Supabase admin config", [...getSupabaseConfigIssues(), !secret ? "SUPABASE_SECRET_KEY is missing." : null].filter(Boolean));
    throw new Error("Supabase server credentials are not configured.");
  }
  client ??= createClient<AdminDatabase>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
