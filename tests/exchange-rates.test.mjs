import assert from "node:assert/strict";
import test from "node:test";
import { colomboDateTimeToUtc } from "../src/lib/exchange-rate-time.ts";
import { readFile } from "node:fs/promises";

test("Sri Lanka admin datetime is converted to UTC", () => {
  assert.equal(colomboDateTimeToUtc("2026-08-08T23:27")?.toISOString(), "2026-08-08T17:57:00.000Z");
});

test("rate datetime validation rejects malformed input", () => {
  assert.equal(colomboDateTimeToUtc("2026-08-08 23:27"), null);
});

test("rate management uses canonical persistence and history resolution", async () => {
  const [action, resolver, migration, data] = await Promise.all([
    readFile("src/modules/admin/commerce-actions.ts", "utf8"),
    readFile("src/lib/exchange-rates.ts", "utf8"),
    readFile("supabase/migrations/20260808180229_repair_aed_lkr_rate_management.sql", "utf8"),
    readFile("src/modules/admin/commerce-data.ts", "utf8"),
  ]);
  assert.match(action, /save_aed_lkr_exchange_rate/);
  assert.match(action, /colomboDateTimeToUtc/);
  assert.match(resolver, /effective_from/);
  assert.match(resolver, /expires_at/);
  assert.match(resolver, /created_at/);
  assert.match(migration, /drop index if exists public\.exchange_rates_one_active_aed_lkr_idx/);
  assert.match(migration, /expires_at is null or expires_at > effective_from/);
  assert.match(data, /resolveActiveAedLkrRate/);
});
