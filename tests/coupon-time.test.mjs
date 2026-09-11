import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { colomboDateTimeToUtc } from "../src/lib/exchange-rate-time.ts";

test("coupon admin datetimes are interpreted as Sri Lanka time", () => {
  assert.equal(
    colomboDateTimeToUtc("2026-09-11T23:59")?.toISOString(),
    "2026-09-11T18:29:00.000Z",
  );
});

test("coupon admin rejects malformed datetimes", () => {
  assert.equal(colomboDateTimeToUtc("2026-09-11 23:59"), null);
});

test("coupon creation persists explicit Colombo-to-UTC dates", async () => {
  const [action, repair, component] = await Promise.all([
    readFile("src/modules/admin/commerce-actions.ts", "utf8"),
    readFile(
      "supabase/migrations/20260911122426_repair_admin_coupon_colombo_times.sql",
      "utf8",
    ),
    readFile("src/modules/admin/components/CommerceManager.tsx", "utf8"),
  ]);
  assert.match(action, /const startsAt = parsed\.data\.starts_at/);
  assert.match(action, /const endsAt = parsed\.data\.ends_at/);
  assert.match(action, /starts_at: parsed\.startsAt\?\.toISOString\(\) \?\? null/);
  assert.match(action, /ends_at: parsed\.endsAt\?\.toISOString\(\) \?\? null/);
  assert.match(action, /export async function updateCouponAction\(/);
  assert.match(action, /\.from\("coupons"\)\n    \.update\(/);
  assert.match(action, /revalidatePath\("\/checkout"\)/);
  assert.match(component, /function CouponEditor/);
  assert.match(component, /aria-label={`Edit \$\{coupon\.code\}`}/);
  assert.match(component, /Save changes/);
  assert.match(repair, /code = 'YARAUAE'/);
  assert.match(repair, /starts_at = starts_at - interval '5 hours 30 minutes'/);
});
