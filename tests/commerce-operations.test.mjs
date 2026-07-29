import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("coupon checkout validates and records discounts inside the order transaction", async () => {
  const [sql, route] = await Promise.all([
    read("../supabase/migrations/20260729005507_atomic_coupon_checkout.sql"),
    read("../src/app/api/checkout/route.ts"),
  ]);
  for (const control of ["active", "starts_at", "ends_at", "country_scope", "minimum_order_amount", "usage_limit", "per_customer_limit", "coupon_products", "coupon_categories", "maximum_discount"]) assert.match(sql, new RegExp(control));
  assert.match(sql, /create_storefront_order\(/);
  assert.match(sql, /insert into public\.coupon_redemptions/);
  assert.match(sql, /total_amount = subtotal_amount - v_discount \+ shipping_fee/);
  assert.match(route, /create_storefront_order_with_coupon/);
});

test("customer returns enforce ownership, delivered state, 14 days, and ordered quantities", async () => {
  const route = await read("../src/app/api/returns/route.ts");
  assert.match(route, /order\.customer_user_id !== userId/);
  assert.match(route, /order\.order_status !== "delivered"/);
  assert.match(route, /14 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(route, /item\.quantity > Number\(quantities\.get/);
  assert.match(route, /status: "requested"/);
});

test("refund administration cannot exceed a verified paid order", async () => {
  const actions = await read("../src/modules/admin/commerce-actions.ts");
  assert.match(actions, /payment_status !== "paid"/);
  assert.match(actions, /alreadyRefunded \+ parsed\.data\.amount > Number\(orderRow\.total_amount\)/);
  assert.match(actions, /No provider refund has been issued/);
});

test("commerce reconciliation enables RLS and records immutable histories", async () => {
  const sql = await read("../supabase/migrations/20260729004652_reconcile_live_commerce_schema.sql");
  for (const table of ["shipping_zones", "shipping_methods", "coupons", "return_requests", "refunds", "return_status_history", "refund_status_history"]) assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  assert.match(sql, /customer_user_id = \(select auth\.uid\(\)\)/);
});
