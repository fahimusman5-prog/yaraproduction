import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { invalidNewsletterResponse, newsletterMessage, newsletterRequestSchema, normalizeNewsletterEmail } from "@/lib/newsletter";
import { logSupabaseError } from "@/lib/supabase/log";

const MAX_BODY_BYTES = 2_048;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const RATE_LIMIT_ATTEMPTS = 6;
const attempts = new Map<string, number[]>();

type SubscriberRow = { status: "subscribed" | "unsubscribed" };
type DatabaseError = { code?: string; message?: string };

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_ATTEMPTS) return true;
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

function response(body: ReturnType<typeof newsletterMessage> | NonNullable<ReturnType<typeof invalidNewsletterResponse>>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return response(newsletterMessage("error"), 415);
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES) return response(newsletterMessage("error"), 413);
  const raw = await request.text().catch(() => "");
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return response(newsletterMessage("error"), 413);
  let json: unknown = null;
  try { json = raw ? JSON.parse(raw) : null; } catch { return response(newsletterMessage("error"), 400); }
  const payload = newsletterRequestSchema.safeParse(json);
  if (!payload.success) return response(newsletterMessage("error"), 400);
  if (payload.data.website) return response(newsletterMessage("subscribed"));
  if (isRateLimited(clientIp(request))) return response(newsletterMessage("rate_limited"), 429);

  const invalid = invalidNewsletterResponse(payload.data.email);
  if (invalid) return response(invalid, 400);
  const email = payload.data.email.trim();
  const normalizedEmail = normalizeNewsletterEmail(email);

  try {
    const supabase = getSupabaseAdminClient();
    const existing = await supabase.from("newsletter_subscribers").select("status").eq("normalized_email", normalizedEmail).maybeSingle();
    if (existing.error) throw existing.error;
    if ((existing.data as SubscriberRow | null)?.status === "subscribed") return response(newsletterMessage("already_subscribed"));
    if ((existing.data as SubscriberRow | null)?.status === "unsubscribed") {
      const { error } = await supabase.from("newsletter_subscribers").update({ status: "subscribed", unsubscribed_at: null, subscribed_at: new Date().toISOString(), source: "website_footer", locale: payload.data.locale ?? null }).eq("normalized_email", normalizedEmail);
      if (error) throw error;
      return response(newsletterMessage("reactivated"));
    }
    const { error } = await supabase.from("newsletter_subscribers").insert({ email, normalized_email: normalizedEmail, source: "website_footer", locale: payload.data.locale ?? null });
    if (!error) return response(newsletterMessage("subscribed"), 201);
    if ((error as DatabaseError).code !== "23505") throw error;

    // The unique index is the final duplicate guard. Resolve a concurrent insert
    // without exposing whether the request raced with another visitor.
    const raced = await supabase.from("newsletter_subscribers").select("status").eq("normalized_email", normalizedEmail).maybeSingle();
    if (raced.error) throw raced.error;
    if ((raced.data as SubscriberRow | null)?.status === "unsubscribed") {
      const { error: updateError } = await supabase.from("newsletter_subscribers").update({ status: "subscribed", unsubscribed_at: null, subscribed_at: new Date().toISOString() }).eq("normalized_email", normalizedEmail);
      if (updateError) throw updateError;
      return response(newsletterMessage("reactivated"));
    }
    return response(newsletterMessage("already_subscribed"));
  } catch (error) {
    logSupabaseError("newsletter", "subscribe", error, { route: "/api/newsletter", table: "newsletter_subscribers" });
    return response(newsletterMessage("error"), 500);
  }
}
