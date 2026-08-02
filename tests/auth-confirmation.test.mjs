import assert from "node:assert/strict";
import test from "node:test";
import { getAuthConfirmUrl, getSiteUrl, normalizeSiteUrl } from "../src/lib/site-url.ts";

const keys = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_VERCEL_URL", "VERCEL_ENV", "NODE_ENV"];

async function withEnv(values, callback) {
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, values);
  try { await callback(); } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test("production auth redirects use the canonical www origin", async () => {
  await withEnv({ NEXT_PUBLIC_SITE_URL: "https://www.yaraproduct.com", NEXT_PUBLIC_APP_URL: "http://localhost:3000", VERCEL_ENV: "production" }, () => {
    assert.equal(getSiteUrl(), "https://www.yaraproduct.com");
    assert.equal(getAuthConfirmUrl(), "https://www.yaraproduct.com/auth/confirm");
  });
});

test("local development may use localhost and preview may use a Vercel URL", async () => {
  await withEnv({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000", NODE_ENV: "development" }, () => assert.equal(getAuthConfirmUrl(), "http://localhost:3000/auth/confirm"));
  await withEnv({ NEXT_PUBLIC_VERCEL_URL: "preview-yara.vercel.app", VERCEL_ENV: "preview" }, () => assert.equal(getSiteUrl(), "https://preview-yara.vercel.app"));
});

test("malformed production URLs are rejected and missing production config fails closed", async () => {
  assert.equal(normalizeSiteUrl("https://www.yaraproduct.com/path", "production"), null);
  assert.equal(normalizeSiteUrl("javascript:alert(1)", "production"), null);
  await withEnv({ NEXT_PUBLIC_SITE_URL: "https://www.yaraproduct.com/auth/confirm", VERCEL_ENV: "production" }, () => assert.equal(getSiteUrl(), null));
});

test("auth callback route is server-side and does not log token values", async () => {
  const source = await (await import("node:fs/promises")).readFile("src/app/auth/confirm/route.ts", "utf8");
  assert.doesNotMatch(source, /console\.(log|error).*token/i);
  assert.match(source, /verifyOtp/);
  assert.match(source, /exchangeCodeForSession/);
  assert.match(source, /role: "customer"/);
  assert.match(source, /allowedNext/);
});

test("confirmation UI handles safe retry, generic resend copy, and noindex route metadata", async () => {
  const source = await (await import("node:fs/promises")).readFile("src/customer-pages/ConfirmationPage.tsx", "utf8");
  const page = await (await import("node:fs/promises")).readFile("src/app/[[...storefront]]/page.tsx", "utf8");
  assert.match(source, /If an account exists and still needs confirmation/);
  assert.match(source, /over_.*limit/);
  assert.doesNotMatch(source, /error_description/);
  assert.match(page, /privateMetadata/);
});

test("signup uses the central confirmation URL and not window.location.origin", async () => {
  const source = await (await import("node:fs/promises")).readFile("src/customer-pages/LoginPage.tsx", "utf8");
  assert.match(source, /getAuthConfirmUrl/);
  assert.match(source, /emailRedirectTo/);
  assert.doesNotMatch(source, /emailRedirectTo:\s*`\$\{window\.location\.origin/);
});
