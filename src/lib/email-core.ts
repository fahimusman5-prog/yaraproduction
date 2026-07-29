export const emailTemplates = [
  "new_order_customer",
  "new_order_admin",
  "order_processing",
  "order_packed",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
  "return_requested",
  "return_approved",
  "return_rejected",
  "refund_recorded",
  "account_deletion_requested",
  "account_deletion_completed",
  "payment_successful",
  "payment_failed",
  "payment_cancelled",
  "payment_pending",
  "refund_completed",
] as const;

export type EmailTemplate = (typeof emailTemplates)[number];

export type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type OrderEmailData = {
  customerName: string;
  orderNumber: string;
  items: OrderEmailItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  paymentFee: number;
  total: number;
  currency: string;
  deliveryAddress: string;
  paymentMethod?: string;
  orderStatus: string;
};

export type EmailInput = {
  template: EmailTemplate;
  recipient: string;
  orderId?: string | null;
  dedupeKey?: string;
  subject: string;
  customerName?: string;
  intro: string;
  details?: Array<[string, string]>;
  order?: OrderEmailData;
  nextSteps?: string;
};

export type EmailConfiguration = {
  apiKey: string;
  from: string;
  replyTo: string;
  adminNotificationEmail: string;
};

export type ProviderFailureCategory =
  | "invalid_recipient"
  | "invalid_sender"
  | "authentication"
  | "rate_limit"
  | "provider_temporary"
  | "provider_permanent"
  | "network";

export type DeliveryProvider = {
  send(message: {
    from: string;
    replyTo: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ id: string }>;
};

export type DeliveryAttempt = {
  attempt: number;
  status: "sent" | "failed";
  providerMessageId?: string;
  errorCategory?: ProviderFailureCategory;
  retrying: boolean;
  attemptedAt: string;
  nextAttemptAt: string | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const senderPattern = /^(?:([^<>]{1,100})\s*)?<([^<>@\s]+@[^<>@\s]+\.[^<>@\s]+)>$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  const normalized = normalizeEmail(value);
  return normalized.length <= 320 && emailPattern.test(normalized);
}

export function isValidSender(value: string) {
  const trimmed = value.trim();
  if (isValidEmail(trimmed)) return true;
  const match = trimmed.match(senderPattern);
  return Boolean(match && match[1]?.trim() && isValidEmail(match[2]));
}

export function readEmailConfiguration(
  environment: NodeJS.ProcessEnv,
): { config: EmailConfiguration | null; issues: string[] } {
  const apiKey = environment.RESEND_API_KEY?.trim() ?? "";
  const from = environment.EMAIL_FROM?.trim() ?? "";
  const replyTo = normalizeEmail(environment.EMAIL_REPLY_TO ?? "");
  const adminNotificationEmail = normalizeEmail(
    environment.ADMIN_NOTIFICATION_EMAIL ?? "",
  );
  const issues: string[] = [];
  if (!apiKey) issues.push("RESEND_API_KEY is missing.");
  if (!from) issues.push("EMAIL_FROM is missing.");
  else if (!isValidSender(from)) issues.push("EMAIL_FROM is invalid.");
  if (!replyTo) issues.push("EMAIL_REPLY_TO is missing.");
  else if (!isValidEmail(replyTo)) issues.push("EMAIL_REPLY_TO is invalid.");
  if (!adminNotificationEmail)
    issues.push("ADMIN_NOTIFICATION_EMAIL is missing.");
  else if (!isValidEmail(adminNotificationEmail))
    issues.push("ADMIN_NOTIFICATION_EMAIL is invalid.");
  return {
    config:
      issues.length === 0
        ? { apiKey, from, replyTo, adminNotificationEmail }
        : null,
    issues,
  };
}

export function classifyProviderFailure(error: unknown): {
  category: ProviderFailureCategory;
  retryable: boolean;
} {
  const record =
    error && typeof error === "object"
      ? (error as { statusCode?: number; status?: number; name?: string })
      : {};
  const status = record.statusCode ?? record.status;
  const name = String(record.name ?? "").toLowerCase();
  if (
    status === 422 ||
    name.includes("validation") ||
    name.includes("invalid_to")
  )
    return { category: "invalid_recipient", retryable: false };
  if (name.includes("invalid_from") || name.includes("domain"))
    return { category: "invalid_sender", retryable: false };
  if (status === 401 || status === 403)
    return { category: "authentication", retryable: false };
  if (status === 429)
    return { category: "rate_limit", retryable: true };
  if (status && status >= 500)
    return { category: "provider_temporary", retryable: true };
  if (status && status >= 400)
    return { category: "provider_permanent", retryable: false };
  return { category: "network", retryable: true };
}

export function retryDelayMs(attempt: number) {
  return [0, 1_000, 4_000][Math.max(0, Math.min(attempt - 1, 2))];
}

export async function deliverWithRetry(input: {
  provider: DeliveryProvider;
  message: Parameters<DeliveryProvider["send"]>[0];
  onAttempt: (attempt: DeliveryAttempt) => Promise<void>;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => Date;
}) {
  const sleep =
    input.sleep ??
    ((milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const now = input.now ?? (() => new Date());
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const attemptedAt = now().toISOString();
    try {
      const result = await input.provider.send(input.message);
      await input.onAttempt({
        attempt,
        status: "sent",
        providerMessageId: result.id,
        retrying: false,
        attemptedAt,
        nextAttemptAt: null,
      });
      return { status: "sent" as const, id: result.id, attempts: attempt };
    } catch (error) {
      const failure = classifyProviderFailure(error);
      const retrying = failure.retryable && attempt < 3;
      const nextAttemptAt = retrying
        ? new Date(now().getTime() + retryDelayMs(attempt + 1)).toISOString()
        : null;
      await input.onAttempt({
        attempt,
        status: "failed",
        errorCategory: failure.category,
        retrying,
        attemptedAt,
        nextAttemptAt,
      });
      if (!retrying)
        return {
          status: "failed" as const,
          category: failure.category,
          attempts: attempt,
        };
      await sleep(retryDelayMs(attempt + 1));
    }
  }
  return { status: "failed" as const, category: "network" as const, attempts: 3 };
}

export function emailDedupeKey(input: EmailInput) {
  if (input.dedupeKey) return input.dedupeKey;
  if (input.orderId)
    return `${input.template}:${input.orderId}:${normalizeEmail(input.recipient)}`;
  return null;
}

export function renderEmail(input: EmailInput) {
  const order = input.order;
  const products =
    order?.items
      .map(
        (item) =>
          `<tr><td style="padding:12px 8px;border-bottom:1px solid #f0dde4">${escapeHtml(item.name)}</td><td style="padding:12px 8px;border-bottom:1px solid #f0dde4;text-align:center">${item.quantity}</td><td style="padding:12px 8px;border-bottom:1px solid #f0dde4;text-align:right">${money(item.subtotal, order.currency)}</td></tr>`,
      )
      .join("") ?? "";
  const orderSummary = order
    ? `<div style="overflow-x:auto"><table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0;font-size:14px"><thead><tr><th style="padding:10px 8px;text-align:left;color:#7f2346">Product</th><th style="padding:10px 8px;text-align:center;color:#7f2346">Qty</th><th style="padding:10px 8px;text-align:right;color:#7f2346">Amount</th></tr></thead><tbody>${products}</tbody></table></div>
      <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${summaryRow("Subtotal", money(order.subtotal, order.currency))}${summaryRow("Coupon discount", `−${money(order.discount, order.currency)}`)}${summaryRow("Delivery", money(order.shipping, order.currency))}${order.paymentFee > 0 ? summaryRow("Payment fee", money(order.paymentFee, order.currency)) : ""}${summaryRow("Final total", money(order.total, order.currency), true)}${summaryRow("Delivery address", order.deliveryAddress)}${order.paymentMethod ? summaryRow("Payment method", titleCase(order.paymentMethod)) : ""}${summaryRow("Order status", titleCase(order.orderStatus))}</table>`
    : "";
  const rows = (input.details ?? [])
    .map(([label, value]) => summaryRow(label, value))
    .join("");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fff7f8;color:#2f2429;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(input.intro)}</div><div style="max-width:640px;margin:0 auto;padding:24px 12px"><div style="padding:14px 8px;text-align:center;letter-spacing:.28em;font-size:22px;font-weight:700;color:#7f2346">YARA</div><div style="background:#fff;border:1px solid #f0dde4;border-radius:22px;padding:clamp(20px,5vw,34px);box-shadow:0 12px 36px rgba(127,35,70,.08)"><p style="margin:0 0 8px;color:#a05b73;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">YARA Productions</p><h1 style="margin:0 0 22px;font-family:Georgia,serif;font-size:clamp(25px,6vw,34px);line-height:1.15;color:#7f2346">${escapeHtml(input.subject)}</h1><p style="line-height:1.7">Hello ${escapeHtml(input.customerName || order?.customerName || "there")},</p><p style="line-height:1.7">${escapeHtml(input.intro)}</p>${orderSummary}${rows ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px">${rows}</table>` : ""}${input.nextSteps ? `<div style="margin-top:24px;padding:16px;border-radius:14px;background:#fff4f7"><strong style="color:#7f2346">Next steps</strong><p style="margin:8px 0 0;line-height:1.7">${escapeHtml(input.nextSteps)}</p></div>` : ""}<p style="margin-top:28px;line-height:1.7;color:#76656d">Need help? Reply to this email or contact YARA Productions through <a style="color:#7f2346" href="https://www.yaraproduct.com">yaraproduct.com</a>.</p></div><p style="padding:18px 8px;text-align:center;font-size:12px;line-height:1.6;color:#8c7780">YARA Productions · Luxury skincare with care</p></div></body></html>`;
}

export function renderEmailText(input: EmailInput) {
  const order = input.order;
  const lines = [
    "YARA Productions",
    input.subject,
    "",
    `Hello ${input.customerName || order?.customerName || "there"},`,
    input.intro,
  ];
  if (order) {
    lines.push(
      "",
      `Order: ${order.orderNumber}`,
      ...order.items.map(
        (item) =>
          `${item.name} × ${item.quantity} — ${money(item.subtotal, order.currency)}`,
      ),
      `Subtotal: ${money(order.subtotal, order.currency)}`,
      `Coupon discount: -${money(order.discount, order.currency)}`,
      `Delivery: ${money(order.shipping, order.currency)}`,
      ...(order.paymentFee > 0
        ? [`Payment fee: ${money(order.paymentFee, order.currency)}`]
        : []),
      `Final total: ${money(order.total, order.currency)}`,
      `Delivery address: ${order.deliveryAddress}`,
      `Order status: ${titleCase(order.orderStatus)}`,
    );
  }
  for (const [label, value] of input.details ?? [])
    lines.push(`${label}: ${value}`);
  if (input.nextSteps) lines.push("", `Next steps: ${input.nextSteps}`);
  lines.push(
    "",
    "Need help? Reply to this email or visit https://www.yaraproduct.com",
  );
  return lines.join("\n");
}

function money(value: number, currency: string) {
  return `${escapeHtml(currency)} ${Number(value).toFixed(2)}`;
}

function summaryRow(label: string, value: string, strong = false) {
  return `<tr><td style="padding:9px 8px;color:#76656d;vertical-align:top">${escapeHtml(label)}</td><td style="padding:9px 8px;text-align:right;vertical-align:top;${strong ? "font-size:17px;font-weight:700;color:#7f2346" : "font-weight:600"}">${escapeHtml(value)}</td></tr>`;
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        } as Record<string, string>
      )[character] ?? character,
  );
}
