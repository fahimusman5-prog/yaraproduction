import assert from "node:assert/strict";
import test from "node:test";
import { prioritizeBestSellers, TOP_BEST_SELLER_SLUGS } from "../src/lib/best-sellers.ts";

const product = (id, name, slug = id) => ({
  id,
  slug,
  name,
  subtitle: "",
  priceLKR: 0,
  priceAED: 0,
  originalPriceLKR: null,
  originalPriceAED: null,
  category: "Skincare",
  concern: "Brightening",
  image: "",
  size: "",
  rating: 0,
  reviews: 0,
  description: "",
  benefits: [],
  howToUse: "",
  ingredients: "",
});

test("top three best sellers are prioritized by confirmed product slugs", () => {
  const products = [
    product("other-1", "Other product"),
    product("2", "YARA Saffron Face Wash", "yara-saffron-face-wash"),
    product("3", "YARA Treatment Soap", "yara-treatment-soap"),
    product("1", "YARA Pinkish Night Cream", "yara-pinkish-night-cream"),
    product("other-2", "Another product"),
  ];

  const ordered = prioritizeBestSellers(products, () => {});

  assert.deepEqual(ordered.slice(0, 3).map((item) => item.slug), TOP_BEST_SELLER_SLUGS);
  assert.deepEqual(ordered.map((item) => item.id), ["1", "3", "2", "other-1", "other-2"]);
});

test("top best sellers can fall back to known stored name variants", () => {
  const products = [
    product("night-live-id", "YARA Night Cream", undefined),
    product("soap-live-id", "Treatment Soap", undefined),
    product("wash-live-id", "Saffron Face Wash (Niacinamide)", undefined),
  ];

  const ordered = prioritizeBestSellers(products, () => {});

  assert.deepEqual(ordered.map((item) => item.id), ["night-live-id", "soap-live-id", "wash-live-id"]);
});

test("missing priority products are skipped without duplicating fallback products", () => {
  const warnings = [];
  const products = [
    product("yara-treatment-soap", "YARA Treatment Soap"),
    product("other-1", "Other product"),
    product("other-2", "Another product"),
  ];

  const ordered = prioritizeBestSellers(products, (message) => warnings.push(message));

  assert.deepEqual(ordered.map((item) => item.id), ["yara-treatment-soap", "other-1", "other-2"]);
  assert.equal(new Set(ordered.map((item) => item.id)).size, ordered.length);
  assert.deepEqual(warnings, [
    "[best-sellers] Missing priority product: yara-pinkish-night-cream",
    "[best-sellers] Missing priority product: yara-saffron-face-wash",
  ]);
});
