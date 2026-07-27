import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getDisplayPricePair, optionalPriceFromForm } from "../src/lib/pricing.ts";

test("original price is optional and only displayed above the selling price", () => {
  assert.deepEqual(getDisplayPricePair(6291, null), { sellingPrice: 6291, originalPrice: null });
  assert.deepEqual(getDisplayPricePair(6291, 6990), { sellingPrice: 6291, originalPrice: 6990 });
  assert.deepEqual(getDisplayPricePair(6291, 6291), { sellingPrice: 6291, originalPrice: null });
  assert.deepEqual(getDisplayPricePair(6291, 6000), { sellingPrice: 6291, originalPrice: null });
});

test("quantity display scales both visual prices without changing selling-price semantics", () => {
  assert.deepEqual(getDisplayPricePair(50, 60, 3), { sellingPrice: 150, originalPrice: 180 });
});

test("blank admin original prices normalize to null", () => {
  assert.equal(optionalPriceFromForm(""), null);
  assert.equal(optionalPriceFromForm("   "), null);
  assert.equal(optionalPriceFromForm("6990"), "6990");
});

test("catalog and regional mapping carry both optional original prices", async () => {
  const route = await readFile(new URL("../src/app/api/storefront/catalog/route.ts", import.meta.url), "utf8");
  const catalog = await readFile(new URL("../src/context/CatalogContext.tsx", import.meta.url), "utf8");
  const format = await readFile(new URL("../src/lib/format.ts", import.meta.url), "utf8");

  assert.match(route, /original_price_lkr,original_price_aed/);
  assert.match(catalog, /originalPriceLKR: row\.original_price_lkr === null \? null/);
  assert.match(catalog, /originalPriceAED: row\.original_price_aed === null \? null/);
  assert.match(format, /country === "sri-lanka" \? product\.originalPriceLKR : product\.originalPriceAED/);
});

test("all customer product-price surfaces use the shared regional display", async () => {
  for (const path of [
    "src/components/ProductCard.tsx",
    "src/customer-pages/ProductPage.tsx",
    "src/customer-pages/CartPage.tsx",
    "src/customer-pages/CheckoutPage.tsx",
  ]) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(source, /<RegionalProductPrice/, `${path} must use the shared regional price display`);
  }
});

test("admin and database reject lower original prices while equal prices remain display-safe", async () => {
  const input = await readFile(new URL("../src/modules/admin/input.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../supabase/migrations/20260714173519_optional_original_product_prices.sql", import.meta.url), "utf8");

  assert.match(input, /input\.original_price_lkr < input\.price_lkr/);
  assert.match(input, /input\.original_price_aed < input\.price_aed/);
  assert.match(migration, /v_original_price_lkr < v_price_lkr/);
  assert.match(migration, /v_original_price_aed < v_price_aed/);
  assert.match(migration, /check \(original_price_lkr is null or original_price_lkr >= 0\)/);
  assert.match(migration, /check \(original_price_aed is null or original_price_aed >= 0\)/);
});

test("checkout and POS calculations continue to use only selling prices", async () => {
  for (const path of [
    "src/app/api/checkout/route.ts",
    "src/modules/pos/actions.ts",
    "supabase/migrations/20260710191605_add_server_pos_sale_rpc.sql",
  ]) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /original_price_/, `${path} must not calculate with original prices`);
  }
});
