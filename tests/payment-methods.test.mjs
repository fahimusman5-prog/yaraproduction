import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_CONFIG,
  hasUsableBankTransferDetails,
  calculateProcessingFee,
} from "../src/lib/payment-methods.ts";

const migrationPath =
  "supabase/migrations/20260729091821_complete_payment_method_system.sql";
const launchPaymentMigrationPath =
  "supabase/migrations/20260802120000_configure_regional_offline_payments.sql";
const uaeBankMigrationPath =
  "supabase/migrations/20260805090000_configure_uae_bank_transfer.sql";

test("payment methods are separate and complete", () => {
  assert.deepEqual(PAYMENT_METHODS, [
    "card",
    "koko",
    "bank_transfer",
    "cash_on_delivery",
  ]);
});

test("placeholder bank details never activate bank transfer", () => {
  assert.equal(
    hasUsableBankTransferDetails({
      accountHolderName: "check",
      bankName: "check",
      accountNumber: "00000000",
    }),
    false,
  );
  assert.equal(
    hasUsableBankTransferDetails({
      accountHolderName: "YARA Productions",
      bankName: "Example Commercial Bank",
      accountNumber: "1234567890",
    }),
    false,
  );
  assert.equal(
    hasUsableBankTransferDetails({
      accountHolderName: "YARA Productions",
      bankName: "Commercial Bank",
      accountNumber: "1234567890",
    }),
    true,
  );
});

test("regional bank validation accepts the supplied UAE IBAN without inventing SWIFT", () => {
  assert.equal(hasUsableBankTransferDetails({ accountHolderName: "FATHIMA FAZEENA FAROOK", bankName: "Mashreq Bank", accountNumber: "019101283587", iban: "AE660330000019101283587", country: "uae" }), true);
  assert.equal(hasUsableBankTransferDetails({ accountHolderName: "Yara International Trading Pvt Ltd", bankName: "Nations Trust Bank", accountNumber: "200260069070", country: "sri-lanka" }), true);
});

test("UAE bank migration is AED-only and keeps regional account data isolated", async () => {
  const sql = await readFile(uaeBankMigrationPath, "utf8");
  assert.match(sql, /region_code = 'AE'/);
  assert.match(sql, /currency = 'AED'/);
  assert.match(sql, /FATHIMA FAZEENA FAROOK/);
  assert.match(sql, /Mashreq Bank/);
  assert.match(sql, /019101283587/);
  assert.match(sql, /AE660330000019101283587/);
  assert.doesNotMatch(sql, /Yara International Trading|200260069070/);
});

test("launch payment configuration is regional and hides incomplete UAE banking", async () => {
  const sql = await readFile(launchPaymentMigrationPath, "utf8");
  assert.match(sql, /Yara International Trading Pvt Ltd/);
  assert.match(sql, /200260069070/);
  assert.match(sql, /Nations Trust Bank/);
  assert.match(sql, /Peradeniya Branch/);
  assert.match(sql, /region_code = 'LK'[\s\S]*?is_enabled = true/);
  assert.match(sql, /set is_enabled = false[\s\S]*?region_code = 'AE'[\s\S]*?payment_method = 'bank_transfer'/);
  assert.match(sql, /add column if not exists iban/);
});

test("payment methods API returns only validated active methods", async () => {
  const api = await readFile("src/app/api/payment-methods/route.ts", "utf8");
  assert.match(api, /\.filter\(\(method\) => method\.enabled && method\.providerAvailable\)/);
  assert.match(api, /hasUsableBankTransferDetails/);
  assert.doesNotMatch(api, /unavailableReason/);
});

test("checkout and account instructions select bank settings by server-validated region", async () => {
  const checkout = await readFile("src/app/api/checkout/route.ts", "utf8");
  const account = await readFile("src/app/api/account/orders/[id]/route.ts", "utf8");
  const success = await readFile("src/app/payment/success/page.tsx", "utf8");
  const ui = await readFile("src/customer-pages/CheckoutPage.tsx", "utf8");
  assert.match(checkout, /parsed\.data\.country === "sri-lanka" \? "LK" : "AE"/);
  assert.match(account, /eq\("region_code", String\(order\.data\.region_code\)\)/);
  assert.match(success, /eq\("region_code", order\.region_code\)/);
  assert.match(ui, /navigator\.clipboard\.writeText/);
  assert.match(ui, /Copied/);
  assert.match(ui, /overflow-wrap:anywhere/);
});

test("processing fees use discounted subtotal plus one delivery charge", () => {
  assert.equal(calculateProcessingFee(10_000, 0, 500, 4), 420);
  assert.equal(calculateProcessingFee(10_000, 0, 500, 9), 945);
  assert.equal(calculateProcessingFee(10_000, 0, 500, 0), 0);
  assert.equal(calculateProcessingFee(10_000, 1_000, 500, 4), 380);
  assert.equal(calculateProcessingFee(101, 0, 0, 4, "LKR"), 4);
  assert.equal(calculateProcessingFee(101, 0, 0, 4, "AED"), 4.04);
  assert.deepEqual(
    Object.fromEntries(
      PAYMENT_METHODS.map((method) => [
        method,
        PAYMENT_METHOD_CONFIG[method].processingFeePercent,
      ]),
    ),
    { card: 4, koko: 9, bank_transfer: 0, cash_on_delivery: 0 },
  );
});

test("database owns payment pricing and immutable snapshots", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(
    sql,
    /v_base := greatest\(0, v_order\.subtotal_amount - v_order\.discount_amount\)\s+\+ v_order\.shipping_fee/,
  );
  assert.match(
    sql,
    /v_fee := round\(v_base \* v_setting\.processing_fee_percent \/ 100, 2\)/,
  );
  assert.match(sql, /processing_fee_percent = v_setting\.processing_fee_percent/);
  assert.match(sql, /payment_fee = v_fee/);
  assert.match(sql, /total_amount = v_base \+ v_fee/);
});

test("online payment finalization is verified and idempotent", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /if v_order\.payment_status = 'paid' then return false/);
  assert.match(sql, /if v_order\.total_amount <> p_amount or v_order\.currency <> p_currency/);
  assert.match(sql, /if v_product\.stock_quantity < v_item\.quantity/);
  assert.match(sql, /inventory_finalized_at = case when p_status_code = 2/);
  assert.match(sql, /where order_id = v_order\.id and provider = 'payhere'/);
});

test("bank transfer and COD remain unpaid while online methods remain pending", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /when 'cash_on_delivery' then 'payment_due_on_delivery'/);
  assert.match(sql, /when 'bank_transfer' then 'awaiting_bank_verification'/);
  assert.match(sql, /when 'cash_on_delivery' then 'confirmed'/);
  assert.match(sql, /when 'bank_transfer' then 'awaiting_bank_transfer'/);
  assert.match(sql, /else 'pending_payment'/);
});

test("checkout rejects unavailable installment providers without fake success", async () => {
  const route = await readFile("src/app/api/checkout/route.ts", "utf8");
  assert.match(route, /Koko is temporarily unavailable/);
  assert.doesNotMatch(route, /MintPay/);
  assert.doesNotMatch(route, /paymentMethod === "koko"[\s\S]{0,200}redirectUrl/);
});

test("payment rules are canonical and cannot be edited in admin", async () => {
  const [migration, api, manager] = await Promise.all([
    readFile(
      "supabase/migrations/20260729163000_canonical_payment_rules.sql",
      "utf8",
    ),
    readFile("src/app/api/payment-methods/route.ts", "utf8"),
    readFile("src/modules/admin/components/CommerceManager.tsx", "utf8"),
  ]);
  assert.match(migration, /when 'card' then 4/);
  assert.match(migration, /when 'koko' then 9/);
  assert.match(migration, /when 'mintpay' then 4/);
  assert.match(migration, /when new\.currency = 'LKR' then round/);
  assert.match(api, /PAYMENT_METHOD_CONFIG\[method\]\.processingFeePercent/);
  const paymentEditor = manager.slice(
    manager.indexOf("function PaymentSettingEditor"),
    manager.indexOf("function DeliverySettingEditor"),
  );
  assert.doesNotMatch(paymentEditor, /name="processing_fee_percent"/);
  assert.doesNotMatch(paymentEditor, /name="minimum_order_amount"/);
  assert.doesNotMatch(paymentEditor, /name="maximum_order_amount"/);
});

test("offline methods create orders directly and never require gateway credentials", async () => {
  const route = await readFile("src/app/api/checkout/route.ts", "utf8");
  assert.match(
    route,
    /paymentMethod === "cash_on_delivery" \|\|\s+parsed\.data\.paymentMethod === "bank_transfer"/,
  );
  assert.match(route, /redirectUrl:[\s\S]*?&\$\{mode\}=1/);
  assert.match(route, /paymentMethod === "card" && !payHereConfig\.enabled/);
  assert.doesNotMatch(
    route,
    /paymentMethod === "(?:cash_on_delivery|bank_transfer)" && process\.env\.PAYMENTS_ENABLED/,
  );
});

test("offline confirmation emails contain exact payment instructions", async () => {
  const route = await readFile("src/app/api/checkout/route.ts", "utf8");
  assert.match(route, /Your YARA order is confirmed/);
  assert.match(route, /Payment will be collected when your order is delivered/);
  assert.match(route, /Your YARA order has been received/);
  assert.match(route, /Please complete the bank transfer using your order number as the reference/);
  assert.match(route, /\["Amount to collect"/);
  assert.match(route, /\["Amount to transfer"/);
  assert.match(route, /\["Transfer reference"/);
});

test("confirmation page distinguishes COD, bank transfer, and online payment", async () => {
  const page = await readFile("src/app/payment/success/page.tsx", "utf8");
  assert.match(page, /bank\?: string/);
  assert.match(page, /Payment method/);
  assert.match(page, /Payment status/);
  assert.match(page, /Amount to pay/);
  assert.match(page, /Amount to transfer/);
  assert.match(page, /Delivery address/);
});

test("regional delivery fees are fully configured in the fixed-delivery migration", async () => {
  const sql = await readFile(
    "supabase/migrations/20260729160000_simplify_fixed_country_delivery.sql",
    "utf8",
  );
  assert.match(sql, /\('LK', 'LKR', 500, true, true\)/);
  assert.match(sql, /\('AE', 'AED', 25, true, true\)/);
  assert.match(sql, /v_subtotal \+ v_delivery \+ v_payment_fee/);
});

test("checkout never renders an indeterminate grand total label", async () => {
  const page = await readFile("src/customer-pages/CheckoutPage.tsx", "utf8");
  assert.doesNotMatch(page, /Grand total[\s\S]{0,300}To be confirmed/);
  assert.match(page, /Grand total[\s\S]{0,300}Unavailable/);
});
