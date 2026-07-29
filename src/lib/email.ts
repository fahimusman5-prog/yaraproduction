import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";

export type EmailTemplate =
  | "email_verification" | "password_reset" | "new_order_customer" | "new_order_admin"
  | "order_processing" | "order_packed" | "order_shipped" | "order_delivered" | "order_cancelled"
  | "return_requested" | "return_approved" | "return_rejected" | "refund_recorded"
  | "newsletter_confirmation" | "account_deletion_requested" | "account_deletion_completed"
  | "payment_successful" | "payment_failed" | "payment_cancelled" | "payment_pending" | "refund_completed";

type EmailInput = {
  template: EmailTemplate;
  recipient: string;
  orderId?: string | null;
  subject: string;
  customerName?: string;
  intro: string;
  details?: Array<[string, string]>;
  nextSteps?: string;
};

export async function sendTransactionalEmail(input: EmailInput) {
  const supabase = getSupabaseAdminClient();
  const recipient = input.recipient.trim().toLowerCase();
  const inserted = await supabase.from("notification_events").insert({
    order_id: input.orderId ?? null,
    recipient,
    channel: "email",
    template: input.template,
    status: "pending",
    payload: { subject: input.subject },
  }).select("id").maybeSingle();
  if (inserted.error?.code === "23505") return { status: "duplicate" as const };
  if (inserted.error || !inserted.data) {
    logSupabaseError("transactional-email", "create-notification-event", inserted.error, { table: "notification_events", orderId: input.orderId ?? undefined });
    return { status: "failed" as const };
  }
  const eventId = (inserted.data as { id: string }).id;
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (provider !== "resend" || !apiKey || !from) {
    await supabase.from("notification_events").update({ status: "skipped", last_error: "Email provider is not configured.", attempts: 0, updated_at: new Date().toISOString() }).eq("id", eventId);
    return { status: "unconfigured" as const };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [recipient], subject: input.subject, html: renderEmail(input) }),
    });
    if (!response.ok) throw new Error(`Provider returned ${response.status}.`);
    const payload = await response.json() as { id?: string };
    await supabase.from("notification_events").update({ status: "sent", provider_message_id: payload.id ?? null, attempts: 1, sent_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq("id", eventId);
    return { status: "sent" as const };
  } catch (error) {
    logSupabaseError("transactional-email", "send-email", error, { table: "notification_events", orderId: input.orderId ?? undefined });
    await supabase.from("notification_events").update({ status: "failed", last_error: "Delivery failed. Retry required.", attempts: 1, next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", eventId);
    return { status: "failed" as const };
  }
}

function renderEmail(input: EmailInput) {
  const rows = (input.details ?? []).map(([label, value]) => `<tr><td style="padding:8px 12px;color:#76656d">${escapeHtml(label)}</td><td style="padding:8px 12px;text-align:right;font-weight:600">${escapeHtml(value)}</td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#fff8f5;color:#2f2429;font-family:Arial,sans-serif"><div style="max-width:640px;margin:auto;padding:32px 20px"><div style="letter-spacing:.24em;font-weight:700;color:#7f2346">YARA</div><div style="margin-top:24px;background:#fff;border-radius:24px;padding:28px"><h1 style="font-family:Georgia,serif;color:#7f2346">${escapeHtml(input.subject)}</h1><p>Hello ${escapeHtml(input.customerName || "there")},</p><p style="line-height:1.7">${escapeHtml(input.intro)}</p>${rows ? `<table style="width:100%;border-collapse:collapse;margin-top:20px">${rows}</table>` : ""}${input.nextSteps ? `<p style="line-height:1.7;margin-top:24px">${escapeHtml(input.nextSteps)}</p>` : ""}<p style="margin-top:28px;color:#76656d">YARA Productions<br/>yaraproduct.com</p></div></div></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}
