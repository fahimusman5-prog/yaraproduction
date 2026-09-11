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
  const [action, repair] = await Promise.all([
    readFile("src/modules/admin/commerce-actions.ts", "utf8"),
    readFile(
      "supabase/migrations/20260911122426_repair_admin_coupon_colombo_times.sql",
      "utf8",
    ),
  ]);
  assert.match(action, /const startsAt = starts_at \? colomboDateTimeToUtc\(starts_at\) : null/);
  assert.match(action, /const endsAt = ends_at \? colomboDateTimeToUtc\(ends_at\) : null/);
  assert.match(action, /starts_at: startsAt\?\.toISOString\(\) \?\? null/);
  assert.match(action, /ends_at: endsAt\?\.toISOString\(\) \?\? null/);
  assert.match(repair, /code = 'YARAUAE'/);
  assert.match(repair, /starts_at = starts_at - interval '5 hours 30 minutes'/);
});
