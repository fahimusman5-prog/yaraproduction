import { createHmac, timingSafeEqual } from "node:crypto";

const secret = () => process.env.ORDER_PDF_SECRET?.trim() || process.env.ORDER_TRACKING_SECRET?.trim() || (() => { throw new Error("ORDER_PDF_SECRET is not configured."); })();
const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

export function createOrderPdfToken(orderNumber: string, lifetimeSeconds = 24 * 60 * 60) {
  const payload = encode(JSON.stringify({ o: orderNumber, e: Math.floor(Date.now() / 1000) + lifetimeSeconds }));
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOrderPdfToken(token: string) {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  let expected: Buffer;
  try { expected = Buffer.from(createHmac("sha256", secret()).update(payload).digest("base64url")); } catch { return null; }
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const value = JSON.parse(decode(payload)) as { o?: unknown; e?: unknown };
    if (typeof value.o !== "string" || !value.o.trim() || !Number.isSafeInteger(value.e) || Number(value.e) <= Math.floor(Date.now() / 1000)) return null;
    return { orderNumber: value.o.trim(), expiresAt: Number(value.e) };
  } catch { return null; }
}
