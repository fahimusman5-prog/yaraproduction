import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("transactional email is environment driven, deduplicated, and failure isolated", async () => {
  const [email, core, migration, checkout] = await Promise.all([
    read("../src/lib/email.ts"),
    read("../src/lib/email-core.ts"),
    read("../supabase/migrations/20260729005809_operational_notifications_analytics_deletion.sql"),
    read("../src/app/api/checkout/route.ts"),
  ]);
  assert.match(email, /new Resend\(apiKey\)/);
  assert.match(core, /environment\.RESEND_API_KEY/);
  assert.match(email, /status: "skipped"/);
  assert.match(email, /next_attempt_at/);
  assert.doesNotMatch(email, /console\.log\(.*apiKey/);
  assert.match(migration, /notification_events_dedupe_key/);
  assert.match(checkout, /if \(order\.created\)/);
});

test("analytics is consent aware and strips personal property names", async () => {
  const [client, route, tracker, migration] = await Promise.all([
    read("../src/lib/analytics.ts"),
    read("../src/app/api/analytics/route.ts"),
    read("../src/components/AnalyticsTracker.tsx"),
    read("../supabase/migrations/20260729075100_complete_analytics_event_idempotency.sql"),
  ]);
  assert.match(client, /yara-analytics-consent/);
  assert.match(client, /email\|phone\|name\|address\|password\|token\|secret/);
  assert.match(client, /NEXT_PUBLIC_ANALYTICS_ENABLED/);
  assert.match(client, /isRecentDuplicate/);
  assert.match(route, /z\.enum\(analyticsEvents\)/);
  assert.match(route, /eventId: z\.string\(\)\.uuid\(\)/);
  assert.match(route, /ignoreDuplicates: true/);
  assert.match(route, /sanitizeAnalyticsProperties\(parsed\.data\.properties\)/);
  assert.match(route, /properties \}/);
  assert.match(tracker, /analyticsConsent\(\)/);
  assert.match(tracker, /send_page_view: false/);
  assert.match(migration, /unique index if not exists analytics_events_event_id_key/);
});

test("analytics covers non-payment commerce events and only prepares payment contracts", async () => {
  const [client, cart, shop, product, checkout, account, layout] =
    await Promise.all([
      read("../src/lib/analytics.ts"),
      read("../src/context/CartContext.tsx"),
      read("../src/customer-pages/ShopPage.tsx"),
      read("../src/customer-pages/ProductPage.tsx"),
      read("../src/customer-pages/CheckoutPage.tsx"),
      read("../src/customer-pages/AccountPage.tsx"),
      read("../src/components/Layout.tsx"),
    ]);
  for (const event of [
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
  ])
    assert.match(client, new RegExp(`"${event}"`));
  assert.match(cart, /trackEvent\("update_quantity"/);
  assert.match(shop, /trackEvent\("filter_usage"/);
  assert.match(product, /trackEvent\("product_view"/);
  assert.match(checkout, /trackEvent\("cod_order_completed"/);
  assert.match(account, /trackEvent\("account_deletion_requested"/);
  assert.match(layout, /trackEvent\("language_changed"/);
  for (const paymentEvent of [
    "purchase",
    "payment_success",
    "payment_failed",
    "payment_cancelled",
    "payment_pending",
    "refund_completed",
  ]) {
    assert.match(client, new RegExp(`"${paymentEvent}"`));
    const emittedOutsideContract = [cart, shop, product, checkout, account, layout]
      .some((source) => source.includes(`trackEvent("${paymentEvent}"`));
    assert.equal(emittedOutsideContract, false);
  }
});

test("account deletion requires recent authentication and preserves anonymised order totals", async () => {
  const [route, migration, actions] = await Promise.all([
    read("../src/app/api/account/deletion/route.ts"),
    read("../supabase/migrations/20260729005809_operational_notifications_analytics_deletion.sql"),
    read("../src/modules/admin/commerce-actions.ts"),
  ]);
  assert.match(route, /Date\.now\(\) - issuedAt > 10 \* 60 \* 1000/);
  assert.match(migration, /delete from public\.customer_addresses/);
  assert.match(migration, /update public\.orders set customer_user_id = null/);
  assert.doesNotMatch(migration, /delete from public\.orders/);
  assert.match(actions, /auth\.admin\.deleteUser/);
});
