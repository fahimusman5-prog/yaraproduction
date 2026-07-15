import assert from "node:assert/strict";
import test from "node:test";
import {
  getAppOrigin,
  getServerEnvIssues,
  getSupabaseAdminConfig,
  getSupabaseAdminConfigIssues,
  getSupabaseConfig,
  getSupabaseConfigIssues,
} from "../src/lib/supabase/env.ts";
import { messageFromSupabaseError } from "../src/lib/supabase/log.ts";

const managedKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
  "PAYHERE_MERCHANT_ID",
  "PAYHERE_MERCHANT_SECRET",
  "VERCEL_ENV",
];

async function withEnv(values, callback) {
  const previous = Object.fromEntries(managedKeys.map((key) => [key, process.env[key]]));
  for (const key of managedKeys) delete process.env[key];
  Object.assign(process.env, values);
  try {
    await callback();
  } finally {
    for (const key of managedKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test("accepts separate publishable and secret Supabase keys", async () => {
  await withEnv({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example_public_value",
    SUPABASE_SECRET_KEY: "sb_secret_example_server_value",
  }, () => {
    assert.deepEqual(getSupabaseConfigIssues(), []);
    assert.deepEqual(getSupabaseAdminConfigIssues(), []);
    assert.equal(getSupabaseConfig()?.publishableKey, "sb_publishable_example_public_value");
    assert.equal(getSupabaseAdminConfig()?.secretKey, "sb_secret_example_server_value");
  });
});

test("rejects a secret key in the browser variable", async () => {
  await withEnv({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_not_for_the_browser",
  }, () => {
    assert.equal(getSupabaseConfig(), null);
    assert.match(getSupabaseConfigIssues().join(" "), /must not contain a Supabase secret key/);
  });
});

test("reports malformed URLs without echoing credentials", async () => {
  await withEnv({
    NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example_public_value",
    SUPABASE_SECRET_KEY: "sb_secret_example_server_value",
    NEXT_PUBLIC_APP_URL: "https://www.yaraproduct.com/checkout",
    PAYHERE_MERCHANT_ID: "merchant",
    PAYHERE_MERCHANT_SECRET: "merchant-secret",
  }, () => {
    const issues = getServerEnvIssues().join(" ");
    assert.match(issues, /valid HTTP or HTTPS URL/);
    assert.match(issues, /origin without a path/);
    assert.doesNotMatch(issues, /merchant-secret|sb_secret_example/);
  });
});

test("uses only a validated application origin in production", async () => {
  await withEnv({
    NEXT_PUBLIC_APP_URL: "https://www.yaraproduct.com",
    VERCEL_ENV: "production",
  }, () => {
    assert.equal(getAppOrigin("https://preview.example.test/checkout"), "https://www.yaraproduct.com");
  });
  await withEnv({
    NEXT_PUBLIC_APP_URL: "https://www.yaraproduct.com/checkout",
    VERCEL_ENV: "production",
  }, () => {
    assert.equal(getAppOrigin("https://preview.example.test/checkout"), null);
  });
  await withEnv({
    NEXT_PUBLIC_APP_URL: "https://wrong.example.test",
    VERCEL_ENV: "production",
  }, () => {
    assert.equal(getAppOrigin("https://preview.example.test/checkout"), null);
  });
});

test("maps database failures to safe admin messages", () => {
  assert.equal(
    messageFromSupabaseError({ code: "23505", message: "duplicate key violates products_slug_key" }, "Save failed."),
    "A product with this slug already exists.",
  );
  assert.equal(
    messageFromSupabaseError({ code: "42703", message: "column products.secret_internal does not exist" }, "Save failed."),
    "The required database structure is unavailable.",
  );
  assert.equal(
    messageFromSupabaseError({ code: "XX000", message: "raw internal SQL detail" }, "Save failed."),
    "Save failed.",
  );
  assert.equal(
    messageFromSupabaseError({ code: "23505", message: "duplicate key violates skin_concerns_name_normalized_key" }, "Save failed."),
    "A skin concern with this name already exists.",
  );
});
