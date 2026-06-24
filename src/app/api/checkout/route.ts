import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createPayHereHash, getPayHereCheckoutUrl } from "@/lib/payhere";

const schema = z.object({
  country: z.enum(["sri-lanka", "uae"]),
  paymentMethod: z.enum(["payhere", "cod"]),
  customer: z.object({
    name: z.string().trim().min(2).max(200),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().min(6).max(50),
    address: z.string().trim().min(5).max(500),
    city: z.string().trim().min(2).max(160),
    postalCode: z.string().trim().max(40),
  }),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive().max(1000) })).min(1).max(100),
});

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "JSON request required." }, { status: 415 });
    }
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid checkout." }, { status: 400 });
    if (parsed.data.paymentMethod === "payhere" && (!process.env.PAYHERE_MERCHANT_ID?.trim() || !process.env.PAYHERE_MERCHANT_SECRET?.trim())) {
      return NextResponse.json({ error: "Online payments are not configured yet." }, { status: 503 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)("create_storefront_order", {
      p_customer: parsed.data.customer,
      p_country: parsed.data.country,
      p_payment_method: parsed.data.paymentMethod,
      p_items: parsed.data.items,
    });
    if (error) throw new Error(error.message);
    const order = (Array.isArray(data) ? data[0] : data) as { order_id: string; order_number: string; total_amount: number; currency: "LKR" | "AED" } | null;
    if (!order) throw new Error("Order creation failed.");

    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    if (parsed.data.paymentMethod === "cod") {
      return NextResponse.json({ redirectUrl: `${origin}/payment/success?order=${order.order_id}&cod=1` });
    }

    const amount = Number(order.total_amount).toFixed(2);
    const { merchantId, hash } = createPayHereHash(String(order.order_number), amount, String(order.currency));
    const [firstName, ...rest] = parsed.data.customer.name.split(/\s+/);
    return NextResponse.json({
      action: getPayHereCheckoutUrl(),
      fields: {
        merchant_id: merchantId,
        return_url: `${origin}/payment/success?order=${order.order_id}`,
        cancel_url: `${origin}/payment/failure?order=${order.order_id}`,
        notify_url: `${origin}/api/payhere/notify`,
        order_id: order.order_number,
        items: `YARA order ${order.order_number}`,
        currency: order.currency,
        amount,
        first_name: firstName,
        last_name: rest.join(" ") || "-",
        email: parsed.data.customer.email,
        phone: parsed.data.customer.phone,
        address: parsed.data.customer.address,
        city: parsed.data.customer.city,
        country: parsed.data.country === "sri-lanka" ? "Sri Lanka" : "United Arab Emirates",
        hash,
      },
    });
  } catch (error) {
    console.error("Checkout initiation failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start checkout." }, { status: 500 });
  }
}
