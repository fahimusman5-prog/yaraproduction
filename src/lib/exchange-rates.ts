import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AedLkrRateRow = {
  id: string;
  source_currency: "AED";
  target_currency: "LKR";
  rate: number | string;
  active: boolean;
  effective_from: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  rate_source?: string;
  updated_by_name?: string | null;
  updated_by_email?: string | null;
};

export type AedLkrResolution = {
  rate: AedLkrRateRow | null;
  reason: "active" | "no_rate_configured" | "rate_not_effective" | "rate_expired" | "rate_inactive" | "rate_query_failed";
  error?: unknown;
};

export async function resolveActiveAedLkrRate(client: SupabaseClient): Promise<AedLkrResolution> {
  const result = await client
    .from("exchange_rates")
    .select("id,source_currency,target_currency,rate,active,effective_from,expires_at,created_at,updated_at,updated_by,rate_source")
    .eq("source_currency", "AED")
    .eq("target_currency", "LKR")
    .order("effective_from", { ascending: false })
    .order("created_at", { ascending: false });
  if (result.error) return { rate: null, reason: "rate_query_failed", error: result.error };

  const rows = (result.data ?? []) as AedLkrRateRow[];
  const now = Date.now();
  const current = rows.find((row) =>
    row.active === true &&
    new Date(row.effective_from).getTime() <= now &&
    (!row.expires_at || new Date(row.expires_at).getTime() > now)
  );
  if (current) return { rate: current, reason: "active" };
  if (!rows.length) return { rate: null, reason: "no_rate_configured" };
  const activeRows = rows.filter((row) => row.active === true);
  if (!activeRows.length) return { rate: null, reason: "rate_inactive" };
  if (activeRows.some((row) => new Date(row.effective_from).getTime() > now))
    return { rate: null, reason: "rate_not_effective" };
  if (activeRows.some((row) => row.expires_at && new Date(row.expires_at).getTime() <= now))
    return { rate: null, reason: "rate_expired" };
  return { rate: null, reason: "rate_inactive" };
}

export function activeRateReasonMessage(reason: AedLkrResolution["reason"]) {
  return {
    no_rate_configured: "No rate configured.",
    rate_not_effective: "The AED→LKR rate is not effective yet.",
    rate_expired: "The AED→LKR rate has expired.",
    rate_inactive: "The AED→LKR rate is inactive.",
    rate_query_failed: "The AED→LKR rate query failed.",
    active: "",
  }[reason];
}
