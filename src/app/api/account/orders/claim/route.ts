import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRequestRateLimit } from "@/lib/rate-limit";
import { logSupabaseError } from "@/lib/supabase/log";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const limit = await consumeRequestRateLimit(request, "account-order-claim", 3, 900);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Please wait before trying again." }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const sessionClient = await getSupabaseServerClient();
  const { data: auth, error: authError } = sessionClient ? await sessionClient.auth.getUser() : { data: { user: null }, error: null };
  const user = auth.user;
  if (authError || !user) return NextResponse.json({ error: "You must be signed in." }, { status: 401, headers: { "x-request-id": requestId } });
  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Verify your email before claiming guest orders." }, { status: 403, headers: { "x-request-id": requestId } });
  }

  const admin = getSupabaseAdminClient();
  const profile = await admin.from("profiles").select("role,email").eq("id", user.id).maybeSingle();
  if (profile.error) {
    logSupabaseError("account-order-claim", "profile", profile.error, { requestId, userId: user.id });
    return NextResponse.json({ error: "We could not verify your account." }, { status: 503, headers: { "x-request-id": requestId } });
  }
  if (profile.data?.role !== "customer" || normalizeEmail(String(profile.data.email)) !== normalizeEmail(user.email)) return NextResponse.json({ error: "Only verified customer accounts can claim guest orders." }, { status: 403, headers: { "x-request-id": requestId } });

  const email = normalizeEmail(user.email);
  const candidates = await admin.from("orders").select("id,customer_user_id,customer_email").is("customer_user_id", null).ilike("customer_email", email).limit(50);
  if (candidates.error) {
    logSupabaseError("account-order-claim", "find-orders", candidates.error, { requestId, userId: user.id });
    return NextResponse.json({ error: "We could not load eligible orders." }, { status: 503, headers: { "x-request-id": requestId } });
  }

  let claimed = 0;
  for (const order of candidates.data ?? []) {
    if (normalizeEmail(String(order.customer_email)) !== email || order.customer_user_id) continue;
    const updated = await admin.from("orders").update({ customer_user_id: user.id, claimed_at: new Date().toISOString(), claimed_by_user_id: user.id, claim_method: "verified_email" }).eq("id", String(order.id)).is("customer_user_id", null).select("id").maybeSingle();
    if (updated.error) {
      logSupabaseError("account-order-claim", "claim-order", updated.error, { requestId, userId: user.id, orderId: String(order.id) });
      return NextResponse.json({ error: "We could not complete the order claim." }, { status: 503, headers: { "x-request-id": requestId } });
    }
    if (updated.data) {
      const audit = await admin.from("order_claim_audit").upsert({ order_id: order.id, claimed_by_user_id: user.id, actor_user_id: user.id, claim_method: "verified_email" }, { onConflict: "order_id,claim_method", ignoreDuplicates: true });
      if (audit.error) {
        logSupabaseError("account-order-claim", "audit", audit.error, { requestId, userId: user.id, orderId: String(order.id) });
        return NextResponse.json({ error: "The order was linked, but the audit record could not be saved." }, { status: 503, headers: { "x-request-id": requestId } });
      }
      claimed += 1;
    }
  }
  return NextResponse.json({ claimed }, { headers: { "x-request-id": requestId } });
}
