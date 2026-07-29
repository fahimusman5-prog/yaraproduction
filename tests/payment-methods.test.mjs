import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PAYMENT_METHODS,
  calculateProcessingFee,
} from "../src/lib/payment-methods.ts";

const migrationPath =
  "supabase/migrations/20260729091821_complete_payment_method_system.sql";

test("payment methods are separate and complete", () => {
  assert.deepEqual(PAYMENT_METHODS, [
    "card",
    "koko",
    "mintpay",
    "bank_transfer",
    "cash_on_delivery",
  ]);
});

test("processing fees use discounted subtotal plus one delivery charge", () => {
  assert.equal(calculateProcessingFee(10_000, 0, 500, 4), 420);
  assert.equal(calculateProcessingFee(10_000, 0, 500, 9), 945);
  assert.equal(calculateProcessingFee(10_000, 0, 500, 0), 0);
  assert.equal(calculateProcessingFee(10_000, 1_000, 500, 4), 380);
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
  assert.match(route, /Koko payment is being activated/);
  assert.match(route, /MintPay payment is being activated/);
  assert.doesNotMatch(route, /paymentMethod === "koko"[\s\S]{0,200}redirectUrl/);
});

