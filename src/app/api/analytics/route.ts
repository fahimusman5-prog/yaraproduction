import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/log";
import { analyticsEvents } from "@/lib/analytics";
import { sanitizeAnalyticsProperties } from "@/lib/analytics";
import { consumeRequestRateLimit } from "@/lib/rate-limit";

const schema = z.object({ eventId: z.string().uuid(), eventName: z.enum(analyticsEvents), anonymousId: z.string().uuid(), sessionId: z.string().uuid(), properties: z.record(z.string(), z.union([z.string().max(300),z.number(),z.boolean()])).refine((value) => JSON.stringify(value).length <= 6000) });

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return new NextResponse(null, { status: 204 });
  const rateLimit = await consumeRequestRateLimit(
    request,
    "analytics",
    120,
    600,
  );
  if (!rateLimit.allowed)
    return new NextResponse(null, {
      status: rateLimit.reason === "limited" ? 429 : 204,
    });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  try {
    const properties = sanitizeAnalyticsProperties(parsed.data.properties);
    const session = await getSupabaseServerClient();
    const { data } = session ? await session.auth.getClaims() : { data: null };
    const country = properties.country;
    const locale = properties.locale;
    const currency = properties.currency;
    const value = properties.value;
    const { error } = await getSupabaseAdminClient().from("analytics_events").upsert({ event_id: parsed.data.eventId, event_name: parsed.data.eventName, anonymous_id: parsed.data.anonymousId, session_id: parsed.data.sessionId, user_id: data?.claims?.sub ?? null, country: country === "sri-lanka" || country === "uae" ? country : null, locale: ["en","si","ta","ar"].includes(String(locale)) ? locale : null, currency: currency === "LKR" || currency === "AED" ? currency : null, value: typeof value === "number" && value >= 0 ? value : null, properties }, { onConflict: "event_id", ignoreDuplicates: true });
    if (error) throw error;
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    logSupabaseError("analytics", "record-event", error, { route: "/api/analytics", table: "analytics_events" });
    return new NextResponse(null, { status: 202 });
  }
}
