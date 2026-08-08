import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("card payment uses the canonical PayHere label and CTA", async () => {
  const [methods, checkout] = await Promise.all([
    read("../src/lib/payment-methods.ts"),
    read("../src/customer-pages/CheckoutPage.tsx"),
  ]);
  assert.match(methods, /label: "Card Payment"/);
  assert.match(methods, /description: "Pay securely through PayHere"/);
  assert.match(methods, /PROCEED TO SECURE CARD PAYMENT/);
  assert.match(checkout, /payment === "card"/);
  assert.match(checkout, /Your card will be charged in LKR through PayHere/);
  assert.match(checkout, /displayed LKR amount will be processed securely through PayHere/);
});

test("PayHere visibility is gated by common configuration and UAE rate", async () => {
  const [route, resolver] = await Promise.all([
    read("../src/app/api/payment-methods/route.ts"),
    read("../src/lib/exchange-rates.ts"),
  ]);
  assert.match(route, /payHere\.enabled/);
  assert.match(route, /payHere\.merchantIdConfigured/);
  assert.match(route, /payHere\.merchantSecretConfigured/);
  assert.match(resolver, /target_currency/);
  assert.match(route, /uaeLkrReady/);
});

test("production origin supports NEXT_PUBLIC_SITE_URL", async () => {
  const env = await read("../src/lib/supabase/env.ts");
  assert.match(env, /NEXT_PUBLIC_SITE_URL \?\? process\.env\.NEXT_PUBLIC_APP_URL/);
  assert.match(env, /const appUrl = \(process\.env\.NEXT_PUBLIC_SITE_URL \?\? process\.env\.NEXT_PUBLIC_APP_URL\)/);
});

test("admin PayHere diagnostics never include secret values", async () => {
  const [data, manager] = await Promise.all([
    read("../src/modules/admin/commerce-data.ts"),
    read("../src/modules/admin/components/CommerceManager.tsx"),
  ]);
  assert.match(data, /merchantSecretConfigured/);
  assert.match(manager, /Secrets and credential values are never displayed/);
  assert.doesNotMatch(manager, /PAYHERE_MERCHANT_SECRET\s*[:=][^,}]+/);
});

test("database enablement keeps runtime gates in place", async () => {
  const migration = await read("../supabase/migrations/20260803061448_enable_regional_payhere_card.sql");
  const route = await read("../src/app/api/payment-methods/route.ts");
  assert.match(migration, /payment_method = 'card'/);
  assert.match(migration, /region_code in \('LK', 'AE'\)/);
  assert.match(route, /Boolean\(row\?\.is_enabled\)/);
});
