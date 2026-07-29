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
  const [route, migration] = await Promise.all([
    read("../src/app/api/returns/route.ts"),
    read("../supabase/migrations/20260729071300_complete_private_return_evidence_and_item_refunds.sql"),
  ]);
  assert.match(route, /admin\.rpc\.bind\(admin\)/);
  assert.match(route, /create_item_return_request/);
  assert.match(migration, /v_order\.customer_user_id is distinct from p_customer_user_id/);
  assert.match(migration, /v_order\.order_status <> 'delivered'/);
  assert.match(migration, /interval '14 days'/);
  assert.match(migration, /v_existing \+ v_requested > v_order_item\.quantity/);
  assert.match(migration, /pg_advisory_xact_lock/);
});

test("refund administration cannot exceed a verified paid order", async () => {
  const [actions, migration] = await Promise.all([
    read("../src/modules/admin/commerce-actions.ts"),
    read("../supabase/migrations/20260729081200_security_scan_remediation.sql"),
  ]);
  assert.match(actions, /payment_status !== "paid"/);
  assert.match(actions, /record_general_refund/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /v_already_refunded \+ p_amount > v_order\.total_amount/);
  assert.match(actions, /No provider refund has been issued/);
});

test("commerce reconciliation enables RLS and records immutable histories", async () => {
  const sql = await read("../supabase/migrations/20260729004652_reconcile_live_commerce_schema.sql");
  for (const table of ["shipping_zones", "shipping_methods", "coupons", "return_requests", "refunds", "return_status_history", "refund_status_history"]) assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  assert.match(sql, /customer_user_id = \(select auth\.uid\(\)\)/);
});

test("return evidence is private, validated, signed for staff, and cleaned up on failure", async () => {
  const [route, migration, data] = await Promise.all([
    read("../src/app/api/returns/route.ts"),
    read("../supabase/migrations/20260729071300_complete_private_return_evidence_and_item_refunds.sql"),
    read("../src/modules/admin/commerce-data.ts"),
  ]);
  assert.match(migration, /'return-evidence',\s+'return-evidence',\s+false/);
  assert.match(migration, /file_size_limit = excluded\.file_size_limit/);
  assert.match(migration, /image\/jpeg','image\/png','image\/webp/);
  assert.match(migration, /storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)\)::text/);
  assert.match(route, /const maxFileBytes = 5 \* 1024 \* 1024/);
  assert.match(route, /const maxFiles = 5/);
  assert.match(route, /\.remove\(uploaded\)/);
  assert.match(route, /\.from\("return_requests"\)\.delete\(\)/);
  assert.match(data, /createSignedUrls\(evidencePaths, 15 \* 60\)/);
});

test("item-level review and refund accounting cannot exceed eligible quantities or paid totals", async () => {
  const [migration, actions] = await Promise.all([
    read("../supabase/migrations/20260729071300_complete_private_return_evidence_and_item_refunds.sql"),
    read("../src/modules/admin/commerce-actions.ts"),
  ]);
  assert.match(migration, /returned_quantity >= 0 and returned_quantity <= quantity/);
  assert.match(migration, /refunded_quantity >= 0 and refunded_quantity <= quantity/);
  assert.match(migration, /approved_quantity \+ rejected_quantity <= quantity/);
  assert.match(migration, /v_return_refunded \+ v_quantity > v_return_item\.approved_quantity/);
  assert.match(migration, /v_order_item\.refunded_quantity \+ v_quantity > v_order_item\.quantity/);
  assert.match(migration, /v_total > v_order\.total_amount/);
  assert.match(migration, /discount_allocation/);
  assert.match(migration, /shipping_allocation/);
  assert.match(actions, /reviewReturnItemsAction/);
  assert.match(actions, /createItemRefundAction/);
  assert.match(actions, /No provider refund was issued/);
});
