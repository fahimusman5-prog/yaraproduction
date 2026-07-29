import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateCartShipping, getProductShipping } from "../src/lib/shipping.ts";

function product(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: "Test product",
    shippingLKR: 300,
    shippingAED: 15,
    freeShippingLKR: false,
    freeShippingAED: false,
    shippingAvailableLKR: true,
    shippingAvailableAED: true,
    shippingCalculationLKR: "per_line",
    shippingCalculationAED: "per_line",
    ...overrides,
  };
}

test("shipping is calculated once per product line by default", () => {
  const quote = calculateCartShipping([{ product: product(), quantity: 3 }], "sri-lanka");
  assert.equal(quote.valid, true);
  assert.equal(quote.total, 300);
});

test("per-unit, free, unavailable, and unconfigured shipping are explicit", () => {
  assert.equal(calculateCartShipping([{ product: product({ shippingCalculationLKR: "per_unit" }), quantity: 3 }], "sri-lanka").total, 900);
  assert.equal(calculateCartShipping([{ product: product({ freeShippingAED: true }), quantity: 2 }], "uae").total, 0);
  assert.equal(getProductShipping(product({ shippingAvailableLKR: false }), "sri-lanka").available, false);
  assert.equal(getProductShipping(product({ shippingLKR: null }), "sri-lanka").configured, false);
});

test("mixed carts sum unique line shipping and reject any invalid line", () => {
  const valid = calculateCartShipping([
    { product: product({ shippingLKR: 300 }), quantity: 4 },
    { product: product({ shippingLKR: 450 }), quantity: 1 },
  ], "sri-lanka");
  assert.equal(valid.total, 750);
  assert.equal(valid.valid, true);
  const invalid = calculateCartShipping([
    { product: product(), quantity: 1 },
    { product: product({ shippingAvailableLKR: false }), quantity: 1 },
  ], "sri-lanka");
  assert.equal(invalid.valid, false);
  assert.equal(invalid.unavailable.length, 1);
});

test("checkout idempotency is enforced in the API and database transaction", async () => {
  const [route, migration] = await Promise.all([
    readFile(new URL("../src/app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260729003438_reconcile_launch_commerce_foundation.sql", import.meta.url), "utf8"),
  ]);
  assert.match(route, /idempotencyKey: z\.string\(\)\.uuid\(\)/);
  assert.match(route, /p_idempotency_key: parsed\.data\.idempotencyKey/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /where idempotency_key = p_idempotency_key/);
  assert.match(migration, /return query select v_existing\.id/);
});

test("configured regional shipping is server-calculated and rejects unconfigured checkout", async () => {
  const [migration, quoteRoute, checkoutRoute] = await Promise.all([
    readFile(
      new URL(
        "../supabase/migrations/20260729062740_complete_regional_shipping_configuration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../src/app/api/shipping/options/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/checkout/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(migration, /create or replace function public\.get_configured_shipping_options/);
  assert.match(migration, /case when p_country = 'sri-lanka'\s+then v_product\.price_lkr else v_product\.price_aed end/);
  assert.doesNotMatch(migration, /v_subtotal\s*:=\s*p_subtotal/);
  assert.match(migration, /raise exception using errcode = '23514',\s+message = 'The selected delivery method is unavailable\.'/);
  assert.match(quoteRoute, /get_configured_shipping_options/);
  assert.match(checkoutRoute, /shippingMethodId: z\.string\(\)\.uuid\(\)/);
  assert.match(checkoutRoute, /option\.methodId === parsed\.data\.shippingMethodId/);
});

test("shipping configuration preserves explicit calculation priority and inactive placeholders", async () => {
  const migration = await readFile(
    new URL(
      "../supabase/migrations/20260729062740_complete_regional_shipping_configuration.sql",
      import.meta.url,
    ),
    "utf8",
  );

  const freeProduct = migration.indexOf("v_product.free_shipping_lkr");
  const productFee = migration.indexOf("v_product.shipping_fee_lkr is not null");
  const methodProductRate = migration.indexOf("v_product_rate.free_shipping");
  const methodFallback = migration.indexOf("v_needs_method_fee := true");
  assert.ok(freeProduct > -1 && freeProduct < productFee);
  assert.ok(productFee < methodProductRate);
  assert.ok(methodProductRate < methodFallback);
  assert.match(migration, /Sri Lanka regional fallback — business rate required/);
  assert.match(migration, /Dubai — business rate required/);
  assert.match(migration, /UAE regional fallback — business rate required/);
  assert.match(migration, /false,\s+0,\s+(?:true|false),\s+false,/);
});

test("shipping administration is authorized, audited, and uses archive semantics", async () => {
  const actions = await readFile(
    new URL("../src/modules/admin/commerce-actions.ts", import.meta.url),
    "utf8",
  );
  for (const action of [
    "createShippingZoneAction",
    "updateShippingZoneAction",
    "archiveShippingZoneAction",
    "createShippingMethodAction",
    "updateShippingMethodAction",
    "archiveShippingMethodAction",
    "saveShippingProductRateAction",
    "archiveShippingProductRateAction",
  ]) {
    assert.match(actions, new RegExp(`export async function ${action}`));
  }
  assert.match(actions, /await requireAdmin\("\/admin\/commerce"\)/);
  assert.match(actions, /shipping_audit_history/);
  assert.match(actions, /const timestamp = new Date\(\)\.toISOString\(\)/);
  assert.match(actions, /archived_at: timestamp/);
});
