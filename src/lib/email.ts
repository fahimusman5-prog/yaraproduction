import "server-only";

import { Resend } from "resend";
import {
  deliverWithRetry,
  emailDedupeKey,
  isValidEmail,
  normalizeEmail,
  readEmailConfiguration,
  renderEmail,
  renderEmailText,
  type DeliveryAttempt,
  type DeliveryProvider,
  type EmailInput,
  type EmailTemplate,
  type OrderEmailData,
  type ProviderFailureCategory,
} from "@/lib/email-core";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";

export type { EmailInput, EmailTemplate, OrderEmailData };

type SendResult =
  | { status: "sent"; id: string }
  | { status: "duplicate" | "unconfigured" | "invalid_recipient" | "failed" };

function createResendProvider(apiKey: string): DeliveryProvider {
  const resend = new Resend(apiKey);
  return {
    async send(message) {
      const { data, error } = await resend.emails.send({
        from: message.from,
        replyTo: message.replyTo,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      if (error) {
        const providerError = new Error("Resend rejected the email.") as Error & {
          statusCode?: number;
        };
        providerError.name = error.name;
        providerError.statusCode = error.statusCode ?? undefined;
        throw providerError;
      }
      if (!data?.id) throw new Error("Resend returned no email identifier.");
      return { id: data.id };
    },
  };
}

export async function sendTransactionalEmail(
  input: EmailInput,
  providerOverride?: DeliveryProvider,
): Promise<SendResult> {
  const recipient = normalizeEmail(input.recipient);
  if (!isValidEmail(recipient)) return { status: "invalid_recipient" };

  try {
    const supabase = getSupabaseAdminClient();
    const dedupeKey = emailDedupeKey({ ...input, recipient });
    const inserted = await supabase
      .from("notification_events")
      .insert({
        order_id: input.orderId ?? null,
        recipient,
        channel: "email",
        provider: "resend",
        template: input.template,
        notification_type: input.template,
        dedupe_key: dedupeKey,
        status: "pending",
        payload: {
          subject: input.subject,
          has_order_summary: Boolean(input.order),
        },
      })
      .select("id")
      .maybeSingle();
    if (inserted.error?.code === "23505")
      return { status: "duplicate" as const };
    if (inserted.error || !inserted.data) {
      logSupabaseError(
        "transactional-email",
        "create-notification-event",
        inserted.error,
        {
          table: "notification_events",
          orderId: input.orderId ?? undefined,
        },
      );
      return { status: "failed" };
    }

    const eventId = (inserted.data as { id: string }).id;
    const { config, issues } = readEmailConfiguration(process.env);
    if (!config) {
      await updateEvent(eventId, {
        status: "skipped",
        error_category: "configuration",
        last_error: "Transactional email is not configured.",
        attempts: 0,
        failed_at: new Date().toISOString(),
      });
      if (issues.length)
        console.warn(
          `[transactional-email] Email skipped: ${issues.join(" ")}`,
        );
      return { status: "unconfigured" };
    }

    const outcome = await deliverWithRetry({
      provider: providerOverride ?? createResendProvider(config.apiKey),
      message: {
        from: config.from,
        replyTo: config.replyTo,
        to: recipient,
        subject: input.subject,
        html: renderEmail(input),
        text: renderEmailText(input),
      },
      async onAttempt(attempt) {
        await recordAttempt(eventId, attempt);
        await updateEvent(eventId, {
          status:
            attempt.status === "sent"
              ? "sent"
              : attempt.retrying
                ? "retrying"
                : "failed",
          provider_message_id: attempt.providerMessageId ?? null,
          attempts: attempt.attempt,
          first_attempt_at:
            attempt.attempt === 1 ? attempt.attemptedAt : undefined,
          last_attempt_at: attempt.attemptedAt,
          sent_at:
            attempt.status === "sent" ? attempt.attemptedAt : undefined,
          failed_at:
            attempt.status === "failed" && !attempt.retrying
              ? attempt.attemptedAt
              : null,
          next_attempt_at: attempt.nextAttemptAt,
          error_category: attempt.errorCategory ?? null,
          last_error:
            attempt.status === "sent"
              ? null
              : safeFailureMessage(
                  attempt.errorCategory ?? "network",
                  attempt.retrying,
                ),
        });
      },
    });
    if (outcome.status === "sent")
      return { status: "sent", id: outcome.id };
    console.error(
      `[transactional-email] Delivery failed (${outcome.category}); event ${eventId}.`,
    );
    return { status: "failed" };
  } catch (error) {
    logSupabaseError("transactional-email", "send-email", error, {
      table: "notification_events",
      orderId: input.orderId ?? undefined,
    });
    return { status: "failed" };
  }
}

export async function sendOrderTransactionalEmail(input: {
  template: EmailTemplate;
  recipient: string;
  orderId: string;
  dedupeKey?: string;
  customerName?: string;
  subject: string;
  intro: string;
  nextSteps: string;
  details?: Array<[string, string]>;
}) {
  try {
    const order = await loadOrderEmailData(input.orderId);
    if (!order) return { status: "failed" as const };
    return sendTransactionalEmail({
      ...input,
      customerName: input.customerName ?? order.customerName,
      order,
    });
  } catch (error) {
    logSupabaseError("transactional-email", "load-order-email", error, {
      table: "orders",
      orderId: input.orderId,
    });
    return { status: "failed" as const };
  }
}

export function getAdminNotificationEmail() {
  const email = normalizeEmail(process.env.ADMIN_NOTIFICATION_EMAIL ?? "");
  return isValidEmail(email) ? email : null;
}

async function loadOrderEmailData(
  orderId: string,
): Promise<OrderEmailData | null> {
  const supabase = getSupabaseAdminClient();
  const [orderResult, itemsResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "order_number,customer_name,subtotal_amount,discount_amount,shipping_fee,payment_fee,total_amount,currency,shipping_address,shipping_city,shipping_postal_code,payment_method,order_status",
      )
      .eq("id", orderId)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("quantity,unit_price,subtotal,products(name)")
      .eq("order_id", orderId)
      .order("id"),
  ]);
  if (orderResult.error || itemsResult.error || !orderResult.data) return null;
  const order = orderResult.data as Record<string, unknown>;
  const items = (itemsResult.data ?? []) as Array<{
    quantity: number;
    unit_price: number;
    subtotal: number;
    products: { name?: string } | Array<{ name?: string }> | null;
  }>;
  const productName = (products: (typeof items)[number]["products"]) =>
    Array.isArray(products)
      ? (products[0]?.name ?? "YARA product")
      : (products?.name ?? "YARA product");
  return {
    customerName: String(order.customer_name ?? "Customer"),
    orderNumber: String(order.order_number),
    items: items.map((item) => ({
      name: productName(item.products),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
    subtotal: Number(order.subtotal_amount),
    discount: Number(order.discount_amount),
    shipping: Number(order.shipping_fee),
    paymentFee: Number(order.payment_fee ?? 0),
    total: Number(order.total_amount),
    currency: String(order.currency),
    deliveryAddress: [
      order.shipping_address,
      order.shipping_city,
      order.shipping_postal_code,
    ]
      .filter(Boolean)
      .join(", "),
    paymentMethod: String(order.payment_method ?? ""),
    orderStatus: String(order.order_status),
  };
}

async function updateEvent(
  eventId: string,
  values: Record<string, unknown>,
) {
  const { error } = await getSupabaseAdminClient()
    .from("notification_events")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error)
    logSupabaseError("transactional-email", "update-notification-event", error, {
      table: "notification_events",
    });
}

async function recordAttempt(
  eventId: string,
  input: DeliveryAttempt,
) {
  const { error } = await getSupabaseAdminClient()
    .from("notification_delivery_attempts")
    .insert({
      notification_event_id: eventId,
      attempt_number: input.attempt,
      provider: "resend",
      status: input.status,
      provider_message_id: input.providerMessageId ?? null,
      error_category: input.errorCategory ?? null,
      attempted_at: input.attemptedAt,
      completed_at: new Date().toISOString(),
    });
  if (error)
    logSupabaseError("transactional-email", "record-delivery-attempt", error, {
      table: "notification_delivery_attempts",
    });
}

function safeFailureMessage(
  category: ProviderFailureCategory,
  retrying: boolean,
) {
  if (retrying) return "Temporary delivery failure; retry scheduled.";
  if (category === "invalid_recipient")
    return "Recipient was rejected; no further retries will be attempted.";
  return "Delivery failed; administrator review required.";
}
