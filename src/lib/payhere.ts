import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

const md5 = (value: string) => createHash("md5").update(value, "utf8").digest("hex").toUpperCase();

export type PayHereConfig = {
  enabled: boolean;
  sandbox: boolean;
  merchantIdConfigured: boolean;
  merchantSecretConfigured: boolean;
};

export function getPayHereConfig(): PayHereConfig {
  return {
    enabled:
      process.env.PAYHERE_ENABLED === "true" ||
      process.env.PAYMENTS_ENABLED === "true",
    sandbox: process.env.PAYHERE_SANDBOX !== "false",
    merchantIdConfigured: Boolean(process.env.PAYHERE_MERCHANT_ID?.trim()),
    merchantSecretConfigured: Boolean(
      process.env.PAYHERE_MERCHANT_SECRET?.trim(),
    ),
  };
}

function credentials() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID?.trim();
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();
  if (!merchantId || !merchantSecret) {
    console.error("[payhere] Missing PayHere credentials", {
      PAYHERE_MERCHANT_ID: Boolean(merchantId),
      PAYHERE_MERCHANT_SECRET: Boolean(merchantSecret),
    });
    throw new Error("PayHere credentials are not configured.");
  }
  return { merchantId, merchantSecret };
}

export function getPayHereCheckoutUrl() {
  return getPayHereConfig().sandbox
    ? "https://sandbox.payhere.lk/pay/checkout"
    : "https://www.payhere.lk/pay/checkout";
}

export function getPayHereEnvironment() {
  return getPayHereConfig().sandbox ? "sandbox" : "live";
}

export function createPayHereHash(orderId: string, amount: string, currency: string) {
  const { merchantId, merchantSecret } = credentials();
  return { merchantId, hash: md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`) };
}

export function verifyPayHereNotification(values: Record<string, string>) {
  const { merchantId, merchantSecret } = credentials();
  if (values.merchant_id !== merchantId || !values.md5sig) return false;
  const expected = md5(`${merchantId}${values.order_id}${values.payhere_amount}${values.payhere_currency}${values.status_code}${md5(merchantSecret)}`);
  const received = values.md5sig.toUpperCase();
  return expected.length === received.length && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
