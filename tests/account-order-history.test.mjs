import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const account = fs.readFileSync("src/customer-pages/AccountPage.tsx", "utf8");
const checkout = fs.readFileSync("src/app/api/checkout/route.ts", "utf8");
const claim = fs.readFileSync("src/app/api/account/orders/claim/route.ts", "utf8");
const detail = fs.readFileSync("src/app/api/account/orders/[id]/route.ts", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260802075233_secure_customer_order_history.sql", "utf8");

test("checkout derives customer_user_id from the verified server session and customer role", () => {
  assert.match(checkout, /auth\.getClaims\(\)/);
  assert.match(checkout, /profileResult\.data\?\.role === "customer"/);
  assert.match(checkout, /p_customer_user_id: customerUserId \?\? null/);
});

test("admin and staff checkout remains guest-semantic", () => {
  assert.doesNotMatch(checkout, /p_customer_user_id:\s*parsed\.data\./);
  assert.match(checkout, /let customerUserId: string \| null = null/);
});

test("customer account query is owner-scoped and query errors are not empty state", () => {
  assert.match(account, /\.eq\("customer_user_id", auth\.user\.id\)/);
  assert.match(account, /We couldn’t load your orders\. Please refresh and try again\./);
  assert.match(account, /state\.error \?/);
});

test("guest claim requires verified email and customer profile", () => {
  assert.match(claim, /user\.email_confirmed_at/);
  assert.match(claim, /profile\.data\?\.role !== "customer"/);
  assert.match(claim, /normalizeEmail\(user\.email\)/);
});

test("guest claim never accepts a browser email or linked order", () => {
  assert.doesNotMatch(claim, /request\.json\(\)/);
  assert.match(claim, /is\("customer_user_id", null\)/);
  assert.match(claim, /claimed_by_user_id: user\.id/);
});

test("guest claim is rate limited and audited", () => {
  assert.match(claim, /account-order-claim/);
  assert.match(claim, /order_claim_audit/);
  assert.match(claim, /onConflict: "order_id,claim_method"/);
});

test("order details are server-authorized, uncached, and redact provider fields", () => {
  assert.match(detail, /eq\("customer_user_id", auth\.user\.id\)/);
  assert.match(detail, /cache-control.*private, no-store/);
  assert.doesNotMatch(detail, /provider_payment_id/);
  assert.doesNotMatch(detail, /service_role/);
});

test("migration records guest claims and gives customers only status-history read access", () => {
  assert.match(migration, /claimed_at/);
  assert.match(migration, /claim_method/);
  assert.match(migration, /order_claim_audit/);
  assert.match(migration, /order_events_customer_or_staff_select/);
  assert.match(migration, /customer_user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /revoke all on public\.order_claim_audit from anon, authenticated/);
});

test("COD and bank-transfer customer copy keeps payment status separate", () => {
  assert.match(account, /Pay the full amount when your order is delivered\./);
  assert.match(account, /Payment confirmed\./);
  assert.match(account, /payment_status !== "paid"/);
});

test("order timeline uses persisted events and the real created_at timestamp", () => {
  assert.match(detail, /from\("order_events"\)/);
  assert.match(account, /new Date\(order\.created_at\)/);
});
