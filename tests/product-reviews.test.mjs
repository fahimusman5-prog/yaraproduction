import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("product review submission uses verified auth and preserves moderation", async () => {
  const route = await readFile("src/app/api/storefront/reviews/[productId]/route.ts", "utf8");
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /if \(userError \|\| !user\)/);
  assert.match(route, /customer_user_id: user\.id/);
  assert.match(route, /status: "hidden"/);
  assert.match(route, /status: 201/);
});

