import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/log";

const events = ["page_view","product_view","category_view","search","add_to_cart","remove_from_cart","cart_view","begin_checkout","coupon_applied","coupon_rejected","region_changed","language_changed","newsletter_subscription","account_registration","login","address_created","address_selected","shipping_method_selected","order_created","order_awaiting_payment","whatsapp_click","return_requested","purchase","payment_success","payment_failure","payment_cancellation","refund"] as const;
const schema = z.object({ eventName: z.enum(events), anonymousId: z.string().uuid(), sessionId: z.string().uuid(), properties: z.record(z.string(), z.union([z.string().max(300),z.number(),z.boolean()])).refine((value) => JSON.stringify(value).length <= 6000) });

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return new NextResponse(null, { status: 204 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  try {
    const session = await getSupabaseServerClient();
    const { data } = session ? await session.auth.getClaims() : { data: null };
    const country = parsed.data.properties.country;
    const locale = parsed.data.properties.locale;
    const currency = parsed.data.properties.currency;
    const value = parsed.data.properties.value;
    const { error } = await getSupabaseAdminClient().from("analytics_events").insert({ event_name: parsed.data.eventName, anonymous_id: parsed.data.anonymousId, session_id: parsed.data.sessionId, user_id: data?.claims?.sub ?? null, country: country === "sri-lanka" || country === "uae" ? country : null, locale: ["en","si","ta","ar"].includes(String(locale)) ? locale : null, currency: currency === "LKR" || currency === "AED" ? currency : null, value: typeof value === "number" && value >= 0 ? value : null, properties: parsed.data.properties });
    if (error) throw error;
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    logSupabaseError("analytics", "record-event", error, { route: "/api/analytics", table: "analytics_events" });
    return new NextResponse(null, { status: 202 });
  }
}
