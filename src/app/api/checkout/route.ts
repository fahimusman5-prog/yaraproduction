import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAppOrigin, getAppUrlIssues } from "@/lib/supabase/env";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import { createPayHereHash, getPayHereCheckoutUrl } from "@/lib/payhere";
import { createOrderTrackingToken } from "@/lib/order-tracking";

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
  shippingMethodId: z.string().uuid().nullable().optional(),
  couponCode: z.string().trim().max(64).nullable().optional(),
});

type CheckoutDatabaseError = { code?: string; message?: string; details?: string; hint?: string };

function checkoutErrorResponse(error: CheckoutDatabaseError) {
  const message = error.message ?? "";
  if (message === "A product is unavailable") {
    return { message: "A product in your cart is no longer available.", status: 409 };
  }
  if (message.startsWith("Insufficient stock for ")) {
    return { message, status: 409 };
  }
  if (message === "Shipping is not configured for this region.") {
    return { message: "Shipping is not currently configured for this region.", status: 503 };
  }
  if (message.startsWith("Coupon ") || message.startsWith("Order does not meet the coupon")) {
    return { message, status: 409 };
  }
  const schemaUnavailable = ["42P01", "42703", "PGRST200", "PGRST205"].includes(error.code ?? "");
  return {
    message: messageFromSupabaseError(error, "Unable to start checkout.", {
      schemaUnavailable: "Checkout is temporarily unavailable.",
    }),
    status: schemaUnavailable ? 503 : 500,
  };
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "JSON request required." }, { status: 415 });
    }
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid checkout." }, { status: 400 });
    if (parsed.data.paymentMethod === "payhere" && (!process.env.PAYHERE_MERCHANT_ID?.trim() || !process.env.PAYHERE_MERCHANT_SECRET?.trim())) {
      return NextResponse.json({ error: "Online payments are not configured yet." }, { status: 503 });
    }
    const origin = getAppOrigin(request.url);
    if (!origin) {
      console.error("[storefront-checkout] Invalid application origin", getAppUrlIssues());
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
    }
    if (!process.env.ORDER_TRACKING_SECRET?.trim()) {
      console.error("[storefront-checkout] ORDER_TRACKING_SECRET is not configured.");
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
    }

    const supabase = getSupabaseAdminClient();
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: CheckoutDatabaseError | null }>;
    const { data, error } = await rpc("create_storefront_order_with_shipping", {
      p_customer: parsed.data.customer,
      p_country: parsed.data.country,
      p_payment_method: parsed.data.paymentMethod,
      p_items: parsed.data.items,
      p_shipping_method_id: parsed.data.shippingMethodId ?? null,
      p_coupon_code: parsed.data.couponCode ?? null,
    });
    if (error) {
      logSupabaseError("storefront-checkout", "create-order", error, {
        route: "/api/checkout",
        table: "orders",
      });
      const response = checkoutErrorResponse(error);
      return NextResponse.json({ error: response.message }, { status: response.status });
    }
    const order = (Array.isArray(data) ? data[0] : data) as { order_id: string; order_number: string; total_amount: number; currency: "LKR" | "AED" } | null;
    if (!order) {
      logSupabaseError("storefront-checkout", "read-created-order", new Error("Order RPC returned no data."), {
        route: "/api/checkout",
        table: "orders",
      });
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
    }
    let trackingToken: string;
    try {
      trackingToken = createOrderTrackingToken(order.order_id, order.order_number);
    } catch (error) {
      logSupabaseError("storefront-checkout", "create-tracking-token", error, { route: "/api/checkout" });
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
    }

    if (parsed.data.paymentMethod === "cod") {
      return NextResponse.json({ redirectUrl: `${origin}/payment/success?order=${order.order_id}&token=${encodeURIComponent(trackingToken)}&cod=1` });
    }

    const amount = Number(order.total_amount).toFixed(2);
    const { merchantId, hash } = createPayHereHash(String(order.order_number), amount, String(order.currency));
    const [firstName, ...rest] = parsed.data.customer.name.split(/\s+/);
    return NextResponse.json({
      action: getPayHereCheckoutUrl(),
      fields: {
        merchant_id: merchantId,
        return_url: `${origin}/payment/success?order=${order.order_id}&token=${encodeURIComponent(trackingToken)}`,
        cancel_url: `${origin}/payment/failure?order=${order.order_id}&token=${encodeURIComponent(trackingToken)}`,
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
    logSupabaseError("storefront-checkout", "initiate-checkout", error, { route: "/api/checkout" });
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
