import "server-only";

import { createHmac } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "limited" | "unconfigured" | "unavailable" };

function requestIdentity(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function consumeRequestRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const secret = process.env.RATE_LIMIT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    console.error({
      area: "rate-limit",
      action: "configuration",
      scope,
      code: "RATE_LIMIT_SECRET_MISSING",
    });
    return { allowed: false, reason: "unconfigured" };
  }
  const keyHash = createHmac("sha256", secret)
    .update(`${scope}:${requestIdentity(request)}`, "utf8")
    .digest("hex");
  try {
    const supabase = getSupabaseAdminClient();
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;
    const { data, error } = await rpc("consume_api_rate_limit", {
      p_scope: scope,
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true
      ? { allowed: true }
      : { allowed: false, reason: "limited" };
  } catch (error) {
    logSupabaseError("rate-limit", "consume", error, { route: scope });
    return { allowed: false, reason: "unavailable" };
  }
}
