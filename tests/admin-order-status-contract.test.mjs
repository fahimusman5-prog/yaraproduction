import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  "supabase/migrations/20260916133000_repair_admin_order_status_contract.sql",
  "utf8",
);
const form = fs.readFileSync("src/modules/admin/components/OrderStatusForm.tsx", "utf8");
const action = fs.readFileSync("src/modules/admin/actions.ts", "utf8");

test("admin order status RPC contract remains aligned with every payment state exposed by the form", () => {
  for (const value of [
    "unpaid",
    "pending",
    "processing",
    "awaiting_bank_verification",
    "payment_due_on_delivery",
    "paid",
    "failed",
    "cancelled",
    "refunded",
  ]) {
    assert.match(form, new RegExp(`"${value}"`));
    assert.match(action, new RegExp(`"${value}"`));
  }
  assert.match(
    fs.readFileSync("supabase/migrations/20260729091821_complete_payment_method_system.sql", "utf8"),
    /'payment_due_on_delivery'.*'awaiting_bank_verification'/s,
  );
});

test("admin fulfilment fields exist before the status action saves them", () => {
  assert.match(migration, /add column if not exists tracking_url text/);
  assert.match(migration, /add column if not exists estimated_delivery_date date/);
  assert.match(action, /tracking_url: parsed\.data\.tracking_url/);
  assert.match(action, /estimated_delivery_date: parsed\.data\.estimated_delivery_date/);
});

test("order admin routes do not eagerly load the native image processor", () => {
  const actions = fs.readFileSync("src/modules/admin/actions.ts", "utf8");
  const nextConfig = fs.readFileSync("next.config.ts", "utf8");
  assert.doesNotMatch(actions, /import \{ optimizeProductImage/);
  assert.match(actions, /await import\("@\/lib\/product-images"\)/);
  assert.match(nextConfig, /serverExternalPackages: \["sharp"\]/);
});
