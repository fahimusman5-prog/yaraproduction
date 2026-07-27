import assert from "node:assert/strict";
import test from "node:test";
import { findProductByRouteKey } from "../src/lib/product-routing.ts";

const product = {
  id: "2abd8ac5-1772-4a35-b6d2-4778258df975",
  slug: "dvfvsfsdv",
};

test("storefront product detail routes resolve live product slugs", () => {
  assert.equal(findProductByRouteKey([product], "dvfvsfsdv"), product);
});

test("storefront product detail routes remain compatible with product ids", () => {
  assert.equal(findProductByRouteKey([product], "2abd8ac5-1772-4a35-b6d2-4778258df975"), product);
});
