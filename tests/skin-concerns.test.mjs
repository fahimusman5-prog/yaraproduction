import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { toSlug } from "../src/modules/admin/lib/format.ts";

test("skin concern slugs are predictable and URL-safe", () => {
  assert.equal(toSlug("Pinkish Glow"), "pinkish-glow");
  assert.equal(toSlug("Anti-Aging & Fine Lines"), "anti-aging-fine-lines");
  assert.equal(toSlug("Under-Eye Care"), "under-eye-care");
});

test("dynamic skin concern migration preserves normalized tables and mappings", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260715161936_dynamic_skin_concern_management.sql", import.meta.url), "utf8");
  assert.doesNotMatch(migration, /drop\s+table|truncate\s+table/i);
  assert.match(migration, /skin_concerns_name_normalized_key/);
  assert.match(migration, /skin_concerns_is_active_idx/);
  assert.match(migration, /product_skin_concerns/);
  assert.match(migration, /Assigned skin concerns must be deactivated instead of deleted/);
});

test("admin concern mutations require an administrator and revalidate storefront routes", async () => {
  const actions = await readFile(new URL("../src/modules/admin/actions.ts", import.meta.url), "utf8");
  assert.match(actions, /requireAdmin\("\/admin\/skin-concerns"\)/);
  assert.match(actions, /save_admin_skin_concern/);
  assert.match(actions, /delete_admin_skin_concern/);
  assert.match(actions, /revalidatePath\("\/sitemap\.xml"\)/);
  assert.match(actions, /revalidatePath\("\/\[locale\]\/skin-concerns\/\[slug\]", "page"\)/);
});
