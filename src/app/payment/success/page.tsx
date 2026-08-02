import Link from "next/link";
import { z } from "zod";
import { isValidOrderTrackingToken } from "@/lib/order-tracking";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type SearchParams = Promise<{
  order?: string;
  token?: string;
  cod?: string;
  bank?: string;
}>;

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).format(value);
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { order: orderId, token, cod, bank } = await searchParams;
  let order:
    | {
        order_number: string;
        currency: string;
        subtotal_amount: number;
        discount_amount: number;
        shipping_fee: number;
        payment_fee: number;
        total_amount: number;
        payment_method: string;
        payment_status: string;
        order_status: string;
        shipping_address: string;
        shipping_city: string;
        shipping_postal_code: string;
      }
    | null = null;

  if (
    orderId &&
    token &&
    z.string().uuid().safeParse(orderId).success
  ) {
    const result = await getSupabaseAdminClient()
      .from("orders")
      .select(
        "order_number,currency,subtotal_amount,discount_amount,shipping_fee,payment_fee,total_amount,payment_method,payment_status,order_status,shipping_address,shipping_city,shipping_postal_code",
      )
      .eq("id", orderId)
      .maybeSingle();
    const data = result.data as Record<string, unknown> | null;
    if (
      data &&
      isValidOrderTrackingToken(token, orderId, String(data.order_number))
    )
      order = {
        order_number: String(data.order_number),
        currency: String(data.currency),
        subtotal_amount: Number(data.subtotal_amount),
        discount_amount: Number(data.discount_amount),
        shipping_fee: Number(data.shipping_fee),
        payment_fee: Number(data.payment_fee ?? 0),
        total_amount: Number(data.total_amount),
        payment_method: String(data.payment_method),
        payment_status: String(data.payment_status),
        order_status: String(data.order_status),
        shipping_address: String(data.shipping_address ?? ""),
        shipping_city: String(data.shipping_city ?? ""),
        shipping_postal_code: String(data.shipping_postal_code ?? ""),
      };
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-yara-ivory p-6 text-center text-yara-charcoal">
      <section className="surface-card w-full max-w-xl p-8 sm:p-12">
        <p className="eyebrow">{cod ? "Order confirmed" : "Order received"}</p>
        <h1 className="mt-4 text-4xl text-yara-wine">
          {cod
            ? "Your order is confirmed."
            : bank
              ? "Your order has been received."
              : "Thank you for your order."}
        </h1>
        <p className="mt-5 text-sm leading-7 text-yara-taupe">
          {cod
            ? "Your order has been confirmed. Please pay the full amount when your order is delivered."
            : bank
              ? "Please complete the bank transfer using your order number as the reference. We will confirm payment after verification."
              : "PayHere is confirming your payment. Your order may remain pending briefly while the secure notification arrives."}
        </p>
        {order && (
          <div className="mt-6 rounded-2xl border border-yara-blush bg-white p-5 text-left text-sm">
            <p className="font-mono text-xs font-bold text-yara-wine">
              {order.order_number}
            </p>
            <dl className="mt-4 grid gap-2">
              <div className="flex justify-between gap-4">
                <dt>Payment method</dt>
                <dd className="capitalize">
                  {order.payment_method.replaceAll("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Payment status</dt>
                <dd className="capitalize">
                  {order.payment_status.replaceAll("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Subtotal</dt>
                <dd>{money(order.subtotal_amount, order.currency)}</dd>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between gap-4">
                  <dt>Discount</dt>
                  <dd>−{money(order.discount_amount, order.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt>Delivery</dt>
                <dd>{money(order.shipping_fee, order.currency)}</dd>
              </div>
              {order.payment_fee > 0 && (
                <div className="flex justify-between gap-4">
                  <dt>Payment fee</dt>
                  <dd>{money(order.payment_fee, order.currency)}</dd>
                </div>
              )}
              <div className="mt-2 flex justify-between gap-4 border-t border-yara-blush pt-3 font-bold text-yara-wine">
                <dt>{cod ? "Amount to pay" : bank ? "Amount to transfer" : "Grand total"}</dt>
                <dd>{money(order.total_amount, order.currency)}</dd>
              </div>
              <div className="mt-2 border-t border-yara-blush pt-3">
                <dt>Delivery address</dt>
                <dd className="mt-1 text-yara-taupe">
                  {[
                    order.shipping_address,
                    order.shipping_city,
                    order.shipping_postal_code,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
            </dl>
          </div>
        )}
        {orderId && !order && (
          <p className="mt-4 text-xs text-yara-taupe">
            Your private order breakdown is available from your account or
            secure order link.
          </p>
        )}
        <Link href="/shop" className="btn-primary mt-8">
          Continue shopping
        </Link>
      </section>
    </main>
  );
}
