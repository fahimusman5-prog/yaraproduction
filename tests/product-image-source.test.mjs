import test from "node:test";
import assert from "node:assert/strict";
import { resolveProductImage, nextProductImageAttempt, PRODUCT_IMAGE_PLACEHOLDER } from "../src/lib/product-image-source.ts";

test("accepts existing public legacy uploads and new immutable image variants without cache busting", () => {
  for (const path of ["products/legacy.png", "products/id/web/asset.webp", "products/id/card/asset.webp", "products/id/thumbnail/asset.webp"]) {
    const url = `https://yhywklzutqzwafulnpcu.supabase.co/storage/v1/object/public/product-images/${path}`;
    assert.equal(resolveProductImage(` ${url} `), url);
  }
  assert.equal(resolveProductImage(PRODUCT_IMAGE_PLACEHOLDER), PRODUCT_IMAGE_PLACEHOLDER);
});
test("rejects absent, malformed, private and unsupported image sources", () => {
  for (const value of [null, undefined, "", " ", "undefined", "products/file.png", "[\"image.png\"]", [], "javascript:alert(1)", "//evil.test/x.png", "https://evil.test/x.png", "https://yhywklzutqzwafulnpcu.supabase.co/storage/v1/object/sign/private/x.png"]) assert.equal(resolveProductImage(value), null);
});
test("optimizer failure retries the same cached public source once then a terminal placeholder", () => {
  const source = "https://yhywklzutqzwafulnpcu.supabase.co/storage/v1/object/public/product-images/products/legacy.png";
  assert.equal(nextProductImageAttempt(source, 0), 1);
  assert.equal(nextProductImageAttempt(source, 1), 2);
  assert.equal(nextProductImageAttempt(source, 2), 2);
  assert.equal(nextProductImageAttempt(PRODUCT_IMAGE_PLACEHOLDER, 0), 0);
  assert.equal(nextProductImageAttempt('/images/missing.png', 0), 1);
  assert.equal(nextProductImageAttempt('/images/missing.png', 1), 1);
});
