import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";
import { sendTransactionalEmail } from "@/lib/email";

const schema = z.object({
  orderId: z.string().uuid(),
  reason: z.enum(["damaged", "defective", "incorrect_item", "unopened_return", "other"]),
  note: z.string().trim().max(2000),
  items: z.array(z.object({ orderItemId: z.string().uuid(), quantity: z.number().int().positive().max(1000) })).min(1).max(100),
});

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "JSON request required." }, { status: 415 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the return request." }, { status: 400 });
  try {
    const session = await getSupabaseServerClient();
    const { data: claims } = session ? await session.auth.getClaims() : { data: null };
    const userId = claims?.claims?.sub;
    const email = claims?.claims?.email;
    if (!userId || typeof email !== "string") return NextResponse.json({ error: "Sign in to request a return." }, { status: 401 });
    const supabase = getSupabaseAdminClient();
    const [orderResult, existingResult] = await Promise.all([
      supabase.from("orders").select("id,customer_user_id,order_status,delivered_at,order_items(id,quantity)").eq("id", parsed.data.orderId).maybeSingle(),
      supabase.from("return_requests").select("id").eq("order_id", parsed.data.orderId).eq("customer_user_id", userId).not("status", "in", '("rejected","cancelled")').maybeSingle(),
    ]);
    const order = orderResult.data as unknown as { id: string; customer_user_id: string | null; order_status: string; delivered_at: string | null; order_items: Array<{ id: string; quantity: number }> } | null;
    if (orderResult.error || !order || order.customer_user_id !== userId) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (existingResult.data) return NextResponse.json({ error: "An active return request already exists for this order." }, { status: 409 });
    if (order.order_status !== "delivered" || !order.delivered_at) return NextResponse.json({ error: "Returns are available after delivery is recorded." }, { status: 409 });
    const deliveredAt = new Date(order.delivered_at).getTime();
    if (!Number.isFinite(deliveredAt) || Date.now() - deliveredAt > 14 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: "The 14-day return window has ended." }, { status: 409 });
    const quantities = new Map((order.order_items ?? []).map((item: { id: string; quantity: number }) => [item.id, item.quantity]));
    if (parsed.data.items.some((item) => !quantities.has(item.orderItemId) || item.quantity > Number(quantities.get(item.orderItemId)))) return NextResponse.json({ error: "One or more return quantities are invalid." }, { status: 400 });
    const created = await supabase.from("return_requests").insert({ order_id: order.id, customer_email: email.toLowerCase(), customer_user_id: userId, reason: parsed.data.reason, customer_note: parsed.data.note, status: "requested" }).select("id").single();
    if (created.error) throw created.error;
    const returnId = (created.data as unknown as { id: string }).id;
    const items = await supabase.from("return_items").insert(parsed.data.items.map((item) => ({ return_request_id: returnId, order_item_id: item.orderItemId, quantity: item.quantity })));
    if (items.error) {
      await supabase.from("return_requests").delete().eq("id", returnId);
      throw items.error;
    }
    await supabase.from("return_status_history").insert({ return_request_id: returnId, from_status: null, to_status: "requested", note: "Customer submitted return request.", actor_id: userId });
    await sendTransactionalEmail({ template: "return_requested", recipient: email, orderId: order.id, subject: "Your YARA return request was received", intro: "We received your return request for review. It has not been automatically approved.", details: [["Reason", parsed.data.reason.replaceAll("_", " ")]], nextSteps: "YARA will review eligibility and contact you with the next step." });
    return NextResponse.json({ message: "Return request submitted for review." }, { status: 201 });
  } catch (error) {
    logSupabaseError("customer-returns", "create-return", error, { route: "/api/returns", table: "return_requests" });
    return NextResponse.json({ error: "The return request could not be submitted." }, { status: 500 });
  }
}
