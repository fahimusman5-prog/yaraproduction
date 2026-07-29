import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sanitizeAnalyticsProperties } from "../src/lib/analytics.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("analytics removes sensitive property names and common PII values", () => {
  assert.deepEqual(
    sanitizeAnalyticsProperties({
      query: "victim@example.com",
      label: "+94 77 123 4567",
      currency: "LKR",
      value: 2500,
    }),
    { currency: "LKR", value: 2500 },
  );
});

test("public commerce routes use the durable pseudonymous rate limiter", async () => {
  const [helper, checkout, shipping, coupon, analytics, environment] =
    await Promise.all([
      read("../src/lib/rate-limit.ts"),
      read("../src/app/api/checkout/route.ts"),
      read("../src/app/api/shipping/options/route.ts"),
      read("../src/app/api/coupons/validate/route.ts"),
      read("../src/app/api/analytics/route.ts"),
      read("../.env.example"),
    ]);
  assert.match(helper, /createHmac\("sha256", secret\)/);
  assert.match(helper, /consume_api_rate_limit/);
  assert.doesNotMatch(helper, /console\.(?:log|error)\([^)]*keyHash/);
  for (const source of [checkout, shipping, coupon, analytics])
    assert.match(source, /consumeRequestRateLimit/);
  assert.match(environment, /RATE_LIMIT_SECRET=/);
  assert.doesNotMatch(environment, /NEXT_PUBLIC_RATE_LIMIT_SECRET/);
});

test("tracking links are signed with an expiry and reject expired tokens", async () => {
  const tracking = await read("../src/lib/order-tracking.ts");
  assert.match(tracking, /expiresAt/);
  assert.match(tracking, /30 \* 24 \* 60 \* 60/);
  assert.match(tracking, /expiresAt <= Math\.floor\(Date\.now\(\) \/ 1000\)/);
  assert.match(tracking, /`\$\{orderId\}:\$\{orderNumber\}:\$\{expiresAt\}`/);
});

test("security migration closes direct staff writes and direct evidence uploads", async () => {
  const migration = await read(
    "../supabase/migrations/20260729081200_security_scan_remediation.sql",
  );
  assert.match(migration, /drop policy if exists staff_manage_/);
  assert.match(migration, /revoke insert, update, delete/);
  assert.match(migration, /drop policy if exists return_evidence_customer_insert/);
  assert.match(migration, /Administrator access required for financial status changes/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /record_general_refund/);
});

test("production database logging excludes raw provider diagnostics", async () => {
  const logger = await read("../src/lib/supabase/log.ts");
  const logFunction = logger.slice(
    logger.indexOf("export function logSupabaseError"),
    logger.indexOf("export function messageFromSupabaseError"),
  );
  assert.doesNotMatch(logFunction, /supabaseError\.message/);
  assert.doesNotMatch(logFunction, /supabaseError\.details/);
  assert.doesNotMatch(logFunction, /supabaseError\.hint/);
  assert.match(logFunction, /supabaseCode/);
});
