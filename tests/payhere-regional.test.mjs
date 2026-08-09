import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const migrationPath =
  "../supabase/migrations/20260803060146_payhere_aed_lkr_only.sql";
const paymentFinalizationMigrationPath =
  "../supabase/migrations/20260729170000_finalize_payhere_regional_currency.sql";
const initializationFixMigrationPath =
  "../supabase/migrations/20260809173917_fix_payhere_checkout_initialization_ambiguity.sql";

test("PayHere order creation qualifies PL/pgSQL-conflicting columns", async () => {
  const sql = await read(initializationFixMigrationPath);
  assert.match(
    sql,
    /from public\.order_items as oi\s+where oi\.order_id = v_order\.id\s+order by oi\.product_id/,
  );
  assert.doesNotMatch(sql, /where order_id = v_order\.id/);
  assert.match(sql, /where er\.source_currency = 'AED'/);
  assert.match(sql, /and er\.target_currency = 'LKR'/);
});

test("Sri Lanka PayHere remains LKR with identity exchange rate", async () => {
  const sql = await read(migrationPath);
  assert.match(sql, /v_order\.currency = 'LKR' and v_order\.region_code = 'LK'/);
  assert.match(sql, /charge_currency = 'LKR'/);
  assert.match(sql, /locked_exchange_rate = 1/);
});

test("UAE order remains AED and converts only the final total to LKR", async () => {
  const sql = await read(migrationPath);
  assert.match(sql, /v_order\.currency = 'AED' and v_order\.region_code = 'AE'/);
  assert.match(sql, /charge_currency = 'LKR'/);
  assert.match(sql, /v_charge_amount := round\(v_order\.total_amount \* v_rate\.rate, 0\)/);
  assert.match(sql, /source_amount = v_order\.total_amount/);
  assert.doesNotMatch(sql, /update public\.orders set[\s\S]{0,300}currency = 'USD'/);
});

test("PayHere never submits INR or AED", async () => {
  const [checkout, sql] = await Promise.all([
    read("../src/app/api/checkout/route.ts"),
    read(migrationPath),
  ]);
  assert.doesNotMatch(checkout, /currency:\s*["'](?:INR|AED)["']/);
  assert.doesNotMatch(sql, /v_charge_currency := '(?:INR|AED)'/);
  assert.match(sql, /charge_currency = 'LKR'/);
});

test("UAE LKR is fail closed without a valid active rate", async () => {
  const [checkout, methods, sql] = await Promise.all([
    read("../src/app/api/checkout/route.ts"),
    read("../src/app/api/payment-methods/route.ts"),
    read(migrationPath),
  ]);
  assert.match(methods, /uaeLkrReady/);
  assert.match(sql, /effective_from <= now\(\) and \(expires_at is null or expires_at > now\(\)\)/);
  assert.match(sql, /target_currency = 'LKR'/);
});

test("browser cannot submit an exchange rate or payment totals", async () => {
  const checkout = await read("../src/app/api/checkout/route.ts");
  assert.doesNotMatch(checkout, /exchangeRate:\s*z\./);
  assert.doesNotMatch(checkout, /chargeAmount:\s*z\./);
  assert.doesNotMatch(checkout, /totalAmount:\s*z\./);
  assert.match(checkout, /prepare_payhere_payment_attempt/);
});

test("payment attempt permanently snapshots source, charge, and rate data", async () => {
  const sql = await read(migrationPath);
  for (const field of [
    "source_currency",
    "source_amount",
    "charge_currency",
    "charge_amount",
    "locked_exchange_rate",
    "exchange_rate_source",
    "exchange_rate_effective_at",
    "provider_environment",
    "initiated_at",
  ])
    assert.match(sql, new RegExp(field));
});

test("PayHere hash uses the stored charge amount and currency", async () => {
  const checkout = await read("../src/app/api/checkout/route.ts");
  assert.match(checkout, /const amount = chargeAmount\.toFixed\(2\)/);
  assert.match(
    checkout,
    /createPayHereHash\(\s*attempt\.provider_order_id,\s*amount,\s*attempt\.charge_currency/,
  );
  assert.match(checkout, /currency: attempt\.charge_currency/);
});

test("PayHere initiation emits safe structured failure diagnostics", async () => {
  const checkout = await read("../src/app/api/checkout/route.ts");
  for (const code of [
    "PAYHERE_CONFIG_MISSING",
    "PAYHERE_HASH_FAILED",
    "ORDER_CREATION_FAILED",
    "INVALID_AMOUNT",
    "INVALID_CURRENCY",
    "INVALID_CALLBACK_URL",
    "PAYHERE_INIT_FAILED",
  ]) {
    assert.match(checkout, new RegExp(`"${code}"`));
  }
  assert.match(checkout, /merchantIdConfigured:/);
  assert.match(checkout, /merchantSecretConfigured:/);
  assert.doesNotMatch(checkout, /merchantSecret:\s*process\.env/);
  assert.doesNotMatch(checkout, /PAYHERE_MERCHANT_SECRET:\s*process\.env/);
});

test("callback verifies the stored attempt amount and currency", async () => {
  const [route, sql] = await Promise.all([
    read("../src/app/api/payhere/notify/route.ts"),
    read(paymentFinalizationMigrationPath),
  ]);
  assert.match(route, /verifyPayHereNotification/);
  assert.match(route, /application\/x-www-form-urlencoded/);
  assert.match(sql, /v_attempt\.charge_amount <> p_amount/);
  assert.match(sql, /v_attempt\.charge_currency <> p_currency/);
  assert.match(route, /try \{[\s\S]*verifyPayHereNotification\([\s\S]*catch \{/);
});

test("PayHere statuses remain safe and callback processing is idempotent", async () => {
  const sql = await read(paymentFinalizationMigrationPath);
  assert.match(sql, /if v_order\.payment_status = 'paid' then return false/);
  assert.match(sql, /when 2 then 'paid'/);
  assert.match(sql, /when -1 then 'cancelled'/);
  assert.match(sql, /when -2 then 'failed'/);
  assert.match(sql, /when -3 then 'payment_failed'/);
  assert.match(sql, /inventory_finalized_at is null/);
});

test("return page never marks an order paid", async () => {
  const success = await read("../src/app/payment/success/page.tsx");
  assert.doesNotMatch(success, /\.update\(/);
  assert.doesNotMatch(success, /payment_status:\s*["']paid["']/);
});

test("UAE disclosure appears before the PayHere redirect", async () => {
  const [page, checkout] = await Promise.all([
    read("../src/customer-pages/CheckoutPage.tsx"),
    read("../src/app/api/checkout/route.ts"),
  ]);
  assert.match(page, /PayHere card charge/);
  assert.match(page, /1 AED = LKR/);
  assert.match(checkout, /conversion rate or international transaction charges/);
  assert.match(page, /PROCEED TO SECURE CARD PAYMENT/);
});

test("exchange-rate administration is approval-gated and admin-only", async () => {
  const [actions, manager, sql] = await Promise.all([
    read("../src/modules/admin/commerce-actions.ts"),
    read("../src/modules/admin/components/CommerceManager.tsx"),
    read(paymentFinalizationMigrationPath),
  ]);
  assert.match(actions, /await requireAdmin\("\/admin\/commerce"\)/);
  assert.match(actions, /updateAedLkrExchangeRateAction/);
  assert.match(manager, /updateAedLkrExchangeRateAction/);
  assert.match(sql, /private\.is_admin\(\)/);
  assert.doesNotMatch(manager, /name="processing_fee_percent"/);
});

test("canonical provider routes exist", async () => {
  const [initiate, notify] = await Promise.all([
    read("../src/app/api/payments/payhere/initiate/route.ts"),
    read("../src/app/api/payments/payhere/notify/route.ts"),
  ]);
  assert.match(initiate, /api\/checkout\/route/);
  assert.match(notify, /api\/payhere\/notify\/route/);
});
