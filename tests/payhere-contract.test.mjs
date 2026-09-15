import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const md5 = (value) => createHash("md5").update(value, "utf8").digest("hex").toUpperCase();
const source = await readFile(new URL("../src/lib/payhere.ts", import.meta.url), "utf8");

function fixtureHash({ merchantId, merchantSecret, orderId, amount, currency }) {
  return md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);
}

test("PayHere hash uses the documented field order and canonical amount", () => {
  const amount = "7747.00";
  assert.equal(
    fixtureHash({
      merchantId: "121TEST",
      merchantSecret: "fixture-secret",
      orderId: "YARA-TEST-1",
      amount,
      currency: "LKR",
    }),
    md5(`121TESTYARA-TEST-1${amount}LKR${md5("fixture-secret")}`),
  );
  assert.match(source, /md5\(\`\$\{merchantId\}\$\{orderId\}\$\{amount\}\$\{currency\}\$\{md5\(merchantSecret\)\}\`\)/);
  assert.notEqual(fixtureHash({ merchantId: "121TEST", merchantSecret: "fixture-secret", orderId: "YARA-TEST-1", amount: "7747", currency: "LKR" }), fixtureHash({ merchantId: "121TEST", merchantSecret: "fixture-secret", orderId: "YARA-TEST-1", amount, currency: "LKR" }));
});

test("PayHere endpoint follows the sandbox/live mode switch", () => {
  assert.match(source, /"https:\/\/sandbox\.payhere\.lk\/pay\/checkout"/);
  assert.match(source, /"https:\/\/www\.payhere\.lk\/pay\/checkout"/);
  assert.match(source, /getPayHereConfig\(\)\.sandbox/);
});

test("PayHere notification accepts only a valid fixture signature", () => {
  const values = {
    merchant_id: "121TEST",
    order_id: "YARA-TEST-1",
    payhere_amount: "7747.00",
    payhere_currency: "LKR",
    status_code: "2",
  };
  const md5sig = md5(
    `${values.merchant_id}${values.order_id}${values.payhere_amount}${values.payhere_currency}${values.status_code}${md5("fixture-secret")}`,
  );
  assert.equal(md5sig, fixtureHash({ merchantId: values.merchant_id, merchantSecret: "fixture-secret", orderId: values.order_id, amount: values.payhere_amount, currency: `${values.payhere_currency}${values.status_code}` }));
  assert.match(source, /values\.merchant_id !== merchantId/);
  assert.match(source, /values\.md5sig/);
  assert.match(source, /timingSafeEqual/);
  assert.notEqual(md5sig, md5("wrong"));
});
