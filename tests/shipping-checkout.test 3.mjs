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
