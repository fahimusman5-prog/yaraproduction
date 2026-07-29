import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("transactional email is environment driven, deduplicated, and failure isolated", async () => {
  const [email, core, migration, checkout] = await Promise.all([
    read("../src/lib/email.ts"),
    read("../src/lib/email-core.ts"),
    read("../supabase/migrations/20260729005809_operational_notifications_analytics_deletion.sql"),
    read("../src/app/api/checkout/route.ts"),
  ]);
  assert.match(email, /new Resend\(apiKey\)/);
  assert.match(core, /environment\.RESEND_API_KEY/);
  assert.match(email, /status: "skipped"/);
  assert.match(email, /next_attempt_at/);
  assert.doesNotMatch(email, /console\.log\(.*apiKey/);
  assert.match(migration, /notification_events_dedupe_key/);
  assert.match(checkout, /if \(order\.created\)/);
});

test("analytics is consent aware and strips personal property names", async () => {
  const [client, route] = await Promise.all([
    read("../src/lib/analytics.ts"),
    read("../src/app/api/analytics/route.ts"),
  ]);
  assert.match(client, /yara-analytics-consent/);
  assert.match(client, /email\|phone\|name\|address\|password\|token/);
  assert.match(client, /NEXT_PUBLIC_ANALYTICS_ENABLED/);
  assert.match(route, /z\.enum\(events\)/);
  assert.match(route, /properties: parsed\.data\.properties/);
});

test("account deletion requires recent authentication and preserves anonymised order totals", async () => {
  const [route, migration, actions] = await Promise.all([
    read("../src/app/api/account/deletion/route.ts"),
    read("../supabase/migrations/20260729005809_operational_notifications_analytics_deletion.sql"),
    read("../src/modules/admin/commerce-actions.ts"),
  ]);
  assert.match(route, /Date\.now\(\) - issuedAt > 10 \* 60 \* 1000/);
  assert.match(migration, /delete from public\.customer_addresses/);
  assert.match(migration, /update public\.orders set customer_user_id = null/);
  assert.doesNotMatch(migration, /delete from public\.orders/);
  assert.match(actions, /auth\.admin\.deleteUser/);
});
