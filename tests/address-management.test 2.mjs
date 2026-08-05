import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("customer address migration isolates ownership and changes defaults atomically", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260729004339_complete_customer_addresses.sql", import.meta.url), "utf8");
  assert.match(sql, /v_user_id uuid := auth\.uid\(\)/);
  assert.match(sql, /where id = p_address_id and user_id = v_user_id/);
  assert.match(sql, /update public\.customer_addresses set is_default = false/);
  assert.match(sql, /delete_customer_address/);
  assert.match(sql, /grant execute .* to authenticated/);
});

test("account and checkout expose address CRUD and selection", async () => {
  const [account, checkout] = await Promise.all([
    readFile(new URL("../src/customer-pages/AccountPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/customer-pages/CheckoutPage.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(account, /set_default_customer_address/);
  assert.match(account, /delete_customer_address/);
  assert.match(account, /Historical orders will not change/);
  assert.match(checkout, /Saved address/);
  assert.match(checkout, /Enter a new address/);
});
