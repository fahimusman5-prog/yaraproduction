import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/log";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const { id } = await params;
  const sessionClient = await getSupabaseServerClient();
  const { data: auth } = sessionClient ? await sessionClient.auth.getUser() : { data: { user: null } };
  if (!auth.user) return NextResponse.json({ error: "You must be signed in." }, { status: 401, headers: { "x-request-id": requestId } });

  const admin = getSupabaseAdminClient();
  const order = await admin.from("orders").select("id,order_number,customer_user_id,customer_name,customer_email,customer_phone,country,region_code,currency,total_amount,subtotal_amount,discount_amount,shipping_fee,payment_fee,payment_method,payment_status,order_status,created_at,shipping_address,shipping_city,shipping_postal_code,courier_name,tracking_number,tracking_url,estimated_delivery_date,shipped_at,delivered_at,bank_transaction_reference").eq("id", id).eq("customer_user_id", auth.user.id).maybeSingle();
  if (order.error) {
    logSupabaseError("account-order-detail", "order", order.error, { requestId, userId: auth.user.id, orderId: id });
    return NextResponse.json({ error: "We couldn’t load this order." }, { status: 503, headers: { "x-request-id": requestId } });
  }
  if (!order.data) return NextResponse.json({ error: "Order not found." }, { status: 404, headers: { "x-request-id": requestId } });
  const [items, events, bank] = await Promise.all([
    admin.from("order_items").select("id,quantity,unit_price,subtotal,products(name,image_url)").eq("order_id", id),
    admin.from("order_events").select("id,from_status,to_status,payment_status,created_at").eq("order_id", id).order("created_at", { ascending: true }),
    order.data.payment_method === "bank_transfer" && order.data.payment_status !== "paid"
      ? admin.from("payment_method_settings").select("account_holder_name,bank_name,branch_name,account_number,instructions").eq("region_code", String(order.data.region_code)).eq("payment_method", "bank_transfer").eq("is_enabled", true).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (items.error || events.error || bank.error) {
    logSupabaseError("account-order-detail", "related-data", items.error ?? events.error ?? bank.error, { requestId, userId: auth.user.id, orderId: String(id) });
    return NextResponse.json({ error: "We couldn’t load this order." }, { status: 503, headers: { "x-request-id": requestId } });
  }
  return NextResponse.json({ order: order.data, items: items.data ?? [], events: events.data ?? [], bank: bank.data ?? null }, { headers: { "x-request-id": requestId, "cache-control": "private, no-store" } });
}
