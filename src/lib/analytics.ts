export const analyticsEvents = [
  "page_view",
  "product_view",
  "category_view",
  "search",
  "filter_usage",
  "add_to_cart",
  "remove_from_cart",
  "update_quantity",
  "view_cart",
  "begin_checkout",
  "address_created",
  "address_selected",
  "shipping_method_selected",
  "coupon_applied",
  "coupon_rejected",
  "region_changed",
  "language_changed",
  "newsletter_subscription",
  "registration",
  "login",
  "return_requested",
  "account_deletion_requested",
  "order_created",
  "cod_order_completed",
  "whatsapp_click",
  // Prepared event contracts. Do not emit these without verified provider events.
  "purchase",
  "payment_success",
  "payment_failed",
  "payment_cancelled",
  "payment_pending",
  "refund_completed",
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];
export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

const consentKey = "yara-analytics-consent";
const anonymousKey = "yara-analytics-anonymous-id";
const sessionKey = "yara-analytics-session-id";
const dedupeKey = "yara-analytics-recent-events";
const blockedProperty = /(email|phone|name|address|password|token|secret)/i;

export function analyticsConsent() {
  return (
    typeof window !== "undefined" &&
    localStorage.getItem(consentKey) === "granted"
  );
}

export function setAnalyticsConsent(granted: boolean) {
  localStorage.setItem(consentKey, granted ? "granted" : "denied");
  window.dispatchEvent(new Event("yara-analytics-consent"));
}

export function sanitizeAnalyticsProperties(properties: AnalyticsProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        !blockedProperty.test(key) &&
        ["string", "number", "boolean"].includes(typeof value),
    ),
  ) as Record<string, string | number | boolean>;
}

export function trackEvent(
  eventName: AnalyticsEvent,
  properties: AnalyticsProperties = {},
) {
  if (
    !analyticsConsent() ||
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true"
  )
    return;
  const safeProperties = sanitizeAnalyticsProperties(properties);
  const signature = `${eventName}:${JSON.stringify(
    Object.entries(safeProperties).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  )}`;
  if (isRecentDuplicate(signature, eventName === "page_view" ? 2000 : 750))
    return;
  const eventId = crypto.randomUUID();
  const anonymousId = stableId(anonymousKey, true);
  const sessionId = stableId(sessionKey, false);
  const payload = {
    eventId,
    eventName,
    anonymousId,
    sessionId,
    properties: safeProperties,
  };
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify(payload),
  });
  const dataLayer = ((
    window as typeof window & { dataLayer?: unknown[] }
  ).dataLayer ??= []);
  dataLayer.push({ event: eventName, event_id: eventId, ...safeProperties });
  if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true")
    console.debug("[analytics]", eventName, safeProperties);
}

function isRecentDuplicate(signature: string, windowMs: number) {
  const now = Date.now();
  let recent: Record<string, number> = {};
  try {
    recent = JSON.parse(sessionStorage.getItem(dedupeKey) ?? "{}");
  } catch {
    recent = {};
  }
  if (now - (recent[signature] ?? 0) < windowMs) return true;
  recent[signature] = now;
  const trimmed = Object.fromEntries(
    Object.entries(recent)
      .filter(([, timestamp]) => now - timestamp < 60_000)
      .slice(-100),
  );
  sessionStorage.setItem(dedupeKey, JSON.stringify(trimmed));
  return false;
}

function stableId(key: string, persistent: boolean) {
  const storage = persistent ? localStorage : sessionStorage;
  const current = storage.getItem(key);
  if (current) return current;
  const id = crypto.randomUUID();
  storage.setItem(key, id);
  return id;
}
