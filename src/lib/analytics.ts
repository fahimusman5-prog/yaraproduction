export type AnalyticsEvent =
  | "page_view" | "product_view" | "category_view" | "search" | "add_to_cart" | "remove_from_cart"
  | "cart_view" | "begin_checkout" | "coupon_applied" | "coupon_rejected" | "region_changed"
  | "language_changed" | "newsletter_subscription" | "account_registration" | "login"
  | "address_created" | "order_created" | "order_awaiting_payment" | "whatsapp_click"
  | "return_requested" | "purchase" | "payment_success" | "payment_failure"
  | "payment_cancellation" | "refund";

const consentKey = "yara-analytics-consent";
const anonymousKey = "yara-analytics-anonymous-id";
const sessionKey = "yara-analytics-session-id";

export function analyticsConsent() {
  return typeof window !== "undefined" && localStorage.getItem(consentKey) === "granted";
}

export function setAnalyticsConsent(granted: boolean) {
  localStorage.setItem(consentKey, granted ? "granted" : "denied");
  window.dispatchEvent(new Event("yara-analytics-consent"));
}

export function trackEvent(eventName: AnalyticsEvent, properties: Record<string, string | number | boolean | null | undefined> = {}) {
  if (!analyticsConsent() || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return;
  const anonymousId = stableId(anonymousKey, true);
  const sessionId = stableId(sessionKey, false);
  const safeProperties = Object.fromEntries(Object.entries(properties).filter(([key, value]) => !/(email|phone|name|address|password|token)/i.test(key) && ["string","number","boolean"].includes(typeof value)));
  void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ eventName, anonymousId, sessionId, properties: safeProperties }) });
  const dataLayer = ((window as typeof window & { dataLayer?: unknown[] }).dataLayer ??= []);
  dataLayer.push({ event: eventName, ...safeProperties });
}

function stableId(key: string, persistent: boolean) {
  const storage = persistent ? localStorage : sessionStorage;
  const current = storage.getItem(key);
  if (current) return current;
  const id = crypto.randomUUID();
  storage.setItem(key, id);
  return id;
}
