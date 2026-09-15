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
  inspectEmailConfiguration,
  type DeliveryAttempt,
  type DeliveryProvider,
  type EmailInput,
  type EmailTemplate,
  type OrderEmailData,
  type ProviderFailureCategory,
} from "@/lib/email-core";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";
import { loadOrderDocument } from "@/lib/order-document";
import { createOrderPdfToken } from "@/lib/order-pdf-token";
import { CANONICAL_SITE_ORIGIN, getSiteUrl } from "@/lib/site-url";

export { inspectEmailConfiguration };

export type { EmailInput, EmailTemplate, OrderEmailData };

type SendResult =
  | { status: "sent"; id: string; eventId: string }
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
    const dedupeKey =
      emailDedupeKey({ ...input, recipient }) ??
      `email:${input.template}:${recipient}:${crypto.randomUUID()}`;
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
    let eventId: string;
    let attemptOffset = 0;
    if (inserted.error?.code === "23505") {
      const existing = await supabase
        .from("notification_events")
        .select("id,status")
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();
      if (existing.error || !existing.data) return { status: "failed" };
      const existingEvent = existing.data as { id: string; status: string };
      if (!["failed", "skipped"].includes(existingEvent.status))
        return { status: "duplicate" as const };
      const attempts = await supabase
        .from("notification_delivery_attempts")
        .select("attempt_number")
        .eq("notification_event_id", existingEvent.id)
        .order("attempt_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (attempts.error) return { status: "failed" };
      attemptOffset = Number((attempts.data as { attempt_number?: number } | null)?.attempt_number ?? 0);
      const reopened = await supabase
        .from("notification_events")
        .update({
          status: "pending",
          error_category: null,
          last_error: null,
          failed_at: null,
          next_attempt_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingEvent.id);
      if (reopened.error) return { status: "failed" };
      eventId = existingEvent.id;
    } else {
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
      eventId = (inserted.data as { id: string }).id;
    }
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
      attemptOffset,
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
      return { status: "sent", id: outcome.id, eventId };
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
    const siteUrl = getSiteUrl() ?? CANONICAL_SITE_ORIGIN;
    const document = order;
    return sendTransactionalEmail({
      ...input,
      customerName: input.customerName ?? order.customerName,
      order: {
        id: document.id,
        customerName: document.customerName,
        phone: document.phone,
        email: document.email,
        country: document.country,
        createdAt: document.createdAt,
        orderNumber: document.orderNumber,
        items: document.items,
        subtotal: document.subtotal,
        discount: document.discount,
        shipping: document.shipping,
        paymentFee: document.paymentFee,
        total: document.total,
        currency: document.currency,
        deliveryAddress: document.addressLines.join(", "),
        paymentMethod: document.paymentMethod,
        paymentStatus: document.paymentStatus,
        paymentHeading: document.payment.heading,
        paymentInstruction: document.payment.type === "cod"
          ? `COLLECT ${document.currency} ${Number(document.total).toFixed(2)}`
          : document.payment.type === "prepaid"
            ? "NO PAYMENT TO COLLECT"
            : document.payment.instruction,
        orderStatus: document.orderStatus,
      },
      pdfUrl: `${siteUrl}/api/orders/pdf?token=${encodeURIComponent(createOrderPdfToken(document.orderNumber))}`,
      adminUrl: `${siteUrl}/admin/orders/${encodeURIComponent(document.id)}`,
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
  return inspectEmailConfiguration(process.env).diagnostic.adminRecipient ?? null;
}

async function loadOrderEmailData(orderId: string) {
  return loadOrderDocument(orderId);
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
