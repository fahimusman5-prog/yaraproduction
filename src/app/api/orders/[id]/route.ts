import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
