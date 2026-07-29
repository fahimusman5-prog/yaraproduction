import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function trackingSecret() {
  const secret = process.env.ORDER_TRACKING_SECRET?.trim();
  if (!secret) throw new Error("ORDER_TRACKING_SECRET is not configured.");
  return secret;
}

export function createOrderTrackingToken(orderId: string, orderNumber: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  const signature = createHmac("sha256", trackingSecret())
    .update(`${orderId}:${orderNumber}:${expiresAt}`, "utf8")
    .digest("base64url");
  return `${expiresAt}.${signature}`;
}

export function isValidOrderTrackingToken(token: string, orderId: string, orderNumber: string) {
  const [rawExpiresAt, rawSignature, extra] = token.split(".");
  const expiresAt = Number(rawExpiresAt);
  if (
    extra !== undefined ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000)
  )
    return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(
      createHmac("sha256", trackingSecret())
        .update(`${orderId}:${orderNumber}:${expiresAt}`, "utf8")
        .digest("base64url"),
    );
  } catch {
    return false;
  }
  const received = Buffer.from(rawSignature ?? "");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
