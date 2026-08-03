import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";
import { verifyPayHereNotification } from "@/lib/payhere";
import {
  getAdminNotificationEmail,
  sendOrderTransactionalEmail,
} from "@/lib/email";

export async function POST(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.includes("application/x-www-form-urlencoded")
  )
    return new Response("Form encoding required", { status: 415 });
  const form = await request.formData();
  const values = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  if (!verifyPayHereNotification(values)) return new Response("Invalid signature", { status: 401 });

  const statusCode = Number(values.status_code);
  const amount = values.payhere_amount;
  if (
    !Number.isInteger(statusCode) ||
    !/^\d+(?:\.\d{1,2})?$/.test(amount ?? "")
  )
    return new Response("Invalid payload", { status: 400 });

  const admin = getSupabaseAdminClient();
  const rpc = admin.rpc.bind(admin) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc("update_payhere_payment", {
    p_order_number: values.order_id,
    p_provider_payment_id: values.payment_id || "",
    p_status_code: statusCode,
    p_amount: amount,
    p_currency: values.payhere_currency,
    p_status_message: values.status_message || "",
  });
  if (error) {
    logSupabaseError("payhere-webhook", "update-payment", error, {
      route: "/api/payhere/notify",
      table: "orders",
      orderNumber: values.order_id,
    });
    return new Response("Unable to update order", { status: 500 });
  }
  if (data === true && statusCode === 2) {
    const paidAttemptResult = await admin
      .from("payment_attempts")
      .select("order_id")
      .eq("provider", "payhere")
      .eq("provider_order_id", values.order_id)
      .maybeSingle();
    const paidAttempt = paidAttemptResult.data as { order_id?: string } | null;
    const orderResult = await admin
      .from("orders")
      .select(
        "id,customer_email,order_number,country,currency,subtotal_amount,discount_amount,shipping_fee,payment_fee,total_amount,payment_method,payment_status",
      )
      .eq("id", paidAttempt?.order_id ?? "")
      .maybeSingle();
    if (orderResult.data) {
      const order = orderResult.data as {
        id: string;
        customer_email: string;
        order_number: string;
        country: string;
        currency: string;
        subtotal_amount: number;
        discount_amount: number;
        shipping_fee: number;
        payment_fee: number;
        total_amount: number;
        payment_method: string;
        payment_status: string;
      };
      const decimals = order.currency === "LKR" ? 0 : 2;
      const money = (value: number) =>
        `${order.currency} ${Number(value).toFixed(decimals)}`;
      const details: Array<[string, string]> = [
        ["Order number", order.order_number],
        ["Region", order.country === "sri-lanka" ? "Sri Lanka" : "UAE"],
        ["Currency", order.currency],
        ["Subtotal", money(order.subtotal_amount)],
        ["Discount", money(order.discount_amount)],
        ["Shipping", money(order.shipping_fee)],
        ["Processing fee", money(order.payment_fee)],
        ["Grand total", money(order.total_amount)],
        ["Payment method", "Card Payment"],
        ["Payment status", "Paid"],
      ];
      const attemptResult = await admin
        .from("payment_attempts")
        .select(
          "source_currency,source_amount,charge_currency,charge_amount,locked_exchange_rate",
        )
        .eq("order_id", order.id)
        .eq("provider", "payhere")
        .eq("provider_order_id", values.order_id)
        .maybeSingle();
      const attempt = attemptResult.data as {
        source_currency?: string;
        source_amount?: number;
        charge_currency?: string;
        charge_amount?: number;
        locked_exchange_rate?: number;
      } | null;
      if (attempt?.source_currency === "AED" && attempt?.charge_currency === "LKR")
        details.push(
          ["Commercial order total", `AED ${Number(attempt.source_amount).toFixed(2)}`],
          ["PayHere charge", `LKR ${Number(attempt.charge_amount).toFixed(2)}`],
          [
            "Locked exchange rate",
            `1 AED = LKR ${Number(attempt.locked_exchange_rate).toFixed(8)}`,
          ],
        );
      const deliveries = [
        sendOrderTransactionalEmail({
          template: "payment_successful",
          recipient: order.customer_email,
          orderId: order.id,
          subject: `Payment received for ${order.order_number}`,
          intro:
            "Your card payment was verified and your YARA order is confirmed.",
          nextSteps:
            "We will email you as your order moves through fulfilment.",
          details,
        }),
      ];
      const adminEmail = getAdminNotificationEmail();
      if (adminEmail)
        deliveries.push(
          sendOrderTransactionalEmail({
            template: "payment_successful",
            recipient: adminEmail,
            orderId: order.id,
            customerName: "YARA team",
            subject: `Paid order ${order.order_number}`,
            intro:
              "PayHere verified a card payment and the order is confirmed.",
            nextSteps:
              "Open the admin workspace to review fulfilment and provider transaction details.",
            details,
          }),
        );
      await Promise.all(deliveries);
    }
  }
  return new Response("OK");
}
