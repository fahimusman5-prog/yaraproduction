import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function trackingSecret() {
  const secret = process.env.ORDER_TRACKING_SECRET?.trim();
  if (!secret) throw new Error("ORDER_TRACKING_SECRET is not configured.");
  return secret;
}

export function createOrderTrackingToken(orderId: string, orderNumber: string) {
  return createHmac("sha256", trackingSecret())
    .update(`${orderId}:${orderNumber}`, "utf8")
    .digest("base64url");
}

export function isValidOrderTrackingToken(token: string, orderId: string, orderNumber: string) {
  let expected: Buffer;
  try {
    expected = Buffer.from(createOrderTrackingToken(orderId, orderNumber));
  } catch {
    return false;
  }
  const received = Buffer.from(token);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
