import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";
import { isValidOrderTrackingToken } from "@/lib/order-tracking";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data, error } = await getSupabaseAdminClient().from("orders").select("order_number,payment_status,order_status,currency,total_amount").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return NextResponse.json({ error: "Not found" }, { status: 404 });
    logSupabaseError("storefront-order-status", "select-order", error, {
      route: `/api/orders/${id}`,
      table: "orders",
      orderId: id,
    });
    return NextResponse.json({ error: "Unable to load order status." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isValidOrderTrackingToken(token, id, String(data.order_number))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
