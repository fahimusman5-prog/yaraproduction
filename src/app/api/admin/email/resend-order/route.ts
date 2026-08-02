import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminNotificationEmail, sendOrderTransactionalEmail } from "@/lib/email";
import { consumeRequestRateLimit } from "@/lib/rate-limit";
import { getStaffContext } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  orderId: z.string().uuid(),
  destination: z.enum(["customer", "admin", "both"]).default("both"),
});

export async function POST(request: Request) {
  const staff = await getStaffContext();
  if (!staff || staff.profile.role !== "admin")
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const rateLimit = await consumeRequestRateLimit(request, "admin-email-resend", 5, 600);
  if (!rateLimit.allowed)
    return NextResponse.json({ error: "Email resends are temporarily unavailable." }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "A valid order and resend destination are required." }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id,order_number,customer_email")
    .eq("id", parsed.data.orderId)
    .maybeSingle();
  if (error || !order)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const row = order as { id: string; order_number: string; customer_email: string };
  const results: Record<string, unknown> = {};
  if (parsed.data.destination === "customer" || parsed.data.destination === "both") {
    results.customer = await sendOrderTransactionalEmail({
      template: "new_order_customer",
      recipient: row.customer_email,
      orderId: row.id,
      subject: `Your YARA order ${row.order_number}`,
      intro: "This is a resend of your YARA order confirmation.",
      nextSteps: "Please keep this message for your order details.",
    });
  }
  if (parsed.data.destination === "admin" || parsed.data.destination === "both") {
    const recipient = getAdminNotificationEmail();
    if (!recipient)
      return NextResponse.json({ error: "The configured admin notification recipient is invalid." }, { status: 503 });
    results.admin = await sendOrderTransactionalEmail({
      template: "new_order_admin",
      recipient,
      orderId: row.id,
      customerName: "YARA team",
      subject: `Resend: new order ${row.order_number}`,
      intro: "This is a resend of the YARA new-order notification.",
      nextSteps: "Review the order in the YARA admin workspace.",
    });
  }
  return NextResponse.json({ orderId: row.id, results });
}
