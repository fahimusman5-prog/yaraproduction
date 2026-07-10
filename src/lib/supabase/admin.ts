import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminConfig, getSupabaseAdminConfigIssues } from "./env";

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
  const config = getSupabaseAdminConfig();
  if (!config) {
    console.error("[supabase:admin] Invalid Supabase admin config", getSupabaseAdminConfigIssues());
    throw new Error("Supabase server credentials are not configured.");
  }
  client ??= createClient<AdminDatabase>(config.url, config.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
