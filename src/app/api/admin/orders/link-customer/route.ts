import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";

const input = z.object({ orderId: z.string().uuid(), customerUserId: z.string().uuid() });
const email = (value: string) => value.trim().toLowerCase();

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const adminContext = await requireAdmin("/admin/orders");
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid order and customer are required." }, { status: 400, headers: { "x-request-id": requestId } });
  const db = getSupabaseAdminClient();
  const [order, profile, authUser] = await Promise.all([
    db.from("orders").select("id,customer_user_id,customer_email").eq("id", parsed.data.orderId).maybeSingle(),
    db.from("profiles").select("id,email,role").eq("id", parsed.data.customerUserId).maybeSingle(),
    db.auth.admin.getUserById(parsed.data.customerUserId),
  ]);
  if (order.error || profile.error || authUser.error) {
    logSupabaseError("admin-order-link", "validate", order.error ?? profile.error ?? authUser.error, { requestId, userId: adminContext.userId, orderId: parsed.data.orderId });
    return NextResponse.json({ error: "The order or customer could not be verified." }, { status: 503, headers: { "x-request-id": requestId } });
  }
  if (!order.data || !profile.data || profile.data.role !== "customer" || !authUser.data.user?.email_confirmed_at || !authUser.data.user.email || email(String(order.data.customer_email)) !== email(String(profile.data.email)) || order.data.customer_user_id) return NextResponse.json({ error: "Only an unlinked guest order matching a verified customer email can be linked." }, { status: 409, headers: { "x-request-id": requestId } });
  const updated = await db.from("orders").update({ customer_user_id: parsed.data.customerUserId, claimed_at: new Date().toISOString(), claimed_by_user_id: parsed.data.customerUserId, claim_method: "admin_verified_link" }).eq("id", parsed.data.orderId).is("customer_user_id", null).select("id").maybeSingle();
  if (updated.error) {
    logSupabaseError("admin-order-link", "link", updated.error, { requestId, userId: adminContext.userId, orderId: parsed.data.orderId });
    return NextResponse.json({ error: "The order could not be linked." }, { status: 503, headers: { "x-request-id": requestId } });
  }
  if (updated.data) {
    const audit = await db.from("order_claim_audit").upsert({ order_id: parsed.data.orderId, claimed_by_user_id: parsed.data.customerUserId, actor_user_id: adminContext.userId, claim_method: "admin_verified_link" }, { onConflict: "order_id,claim_method", ignoreDuplicates: true });
    if (audit.error) {
      logSupabaseError("admin-order-link", "audit", audit.error, { requestId, userId: adminContext.userId, orderId: parsed.data.orderId });
      return NextResponse.json({ error: "The order was linked, but the audit record could not be saved." }, { status: 503, headers: { "x-request-id": requestId } });
    }
  }
  return NextResponse.json({ linked: Boolean(updated.data) }, { headers: { "x-request-id": requestId } });
}
