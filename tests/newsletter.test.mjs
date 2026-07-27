import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { invalidNewsletterResponse, normalizeNewsletterEmail, newsletterMessage } from "../src/lib/newsletter.ts";

test("newsletter validation distinguishes empty and invalid email input", () => {
  assert.equal(invalidNewsletterResponse("")?.message, "Please enter your email address.");
  assert.equal(invalidNewsletterResponse("not-an-email")?.message, "Please enter a valid email address.");
  assert.equal(invalidNewsletterResponse("member@example.com"), null);
});

test("newsletter normalizes email and has branded successful outcomes", () => {
  assert.equal(normalizeNewsletterEmail("  Member@Example.COM  "), "member@example.com");
  assert.deepEqual(newsletterMessage("subscribed"), { success: true, status: "subscribed", message: "Welcome to the YARA inner circle." });
  assert.deepEqual(newsletterMessage("reactivated"), { success: true, status: "reactivated", message: "Welcome back to the YARA inner circle." });
  assert.equal(newsletterMessage("already_subscribed").success, false);
});

test("subscription route guards malformed data, rate limits, and unique-key races", async () => {
  const source = await readFile(new URL("../src/app/api/newsletter/route.ts", import.meta.url), "utf8");
  assert.match(source, /MAX_BODY_BYTES/);
  assert.match(source, /isRateLimited/);
  assert.match(source, /website/);
  assert.match(source, /code !== "23505"/);
  assert.match(source, /newsletterMessage\("already_subscribed"\)/);
  assert.match(source, /newsletterMessage\("reactivated"\)/);
});

test("newsletter schema protects subscribers from public reads and writes", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260726160251_add_newsletter_subscribers.sql", import.meta.url), "utf8");
  assert.match(migration, /normalized_email text not null unique/);
  assert.match(migration, /enable row level security/);
  assert.doesNotMatch(migration, /for insert to (anon|authenticated)/);
  assert.match(migration, /for select to authenticated/);
  assert.match(migration, /private\.is_admin\(\)/);
});

test("admin newsletter tools enforce admin authorization and safely export CSV", async () => {
  const [data, actions, exportRoute, manager] = await Promise.all([
    readFile(new URL("../src/modules/admin/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/modules/admin/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/admin/newsletter/export/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/modules/admin/components/NewsletterSubscriberManager.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(data, /requireAdmin\("\/admin\/newsletter"\)/);
  assert.match(actions, /requireAdmin\("\/admin\/newsletter"\)/);
  assert.match(exportRoute, /await requireAdmin\("\/admin\/newsletter"\)/);
  assert.match(exportRoute, /replaceAll\('\"', '\"\"'\)/);
  assert.match(manager, /Search subscribers/);
});

test("footer form supports loading feedback, keyboard form submit, and successful reset", async () => {
  const source = await readFile(new URL("../src/components/NewsletterForm.tsx", import.meta.url), "utf8");
  assert.match(source, /<form[^>]*onSubmit=\{submit\}/);
  assert.match(source, /disabled=\{submitting\}/);
  assert.match(source, /LoaderCircle/);
  assert.match(source, /if \(next\.success\) setEmail\(""\)/);
  assert.match(source, /aria-live="polite"/);
});
