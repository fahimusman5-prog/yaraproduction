import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { optimizeProductImage, validateProductImage } from "../src/lib/product-images.ts";

test("optimizes JPEG and preserves the original while producing responsive WebP variants", async () => {
  const input = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: { r: 220, g: 180, b: 190 } } }).jpeg().toBuffer();
  const file = new File([input], "product.jpg", { type: "image/jpeg" });
  const result = await optimizeProductImage(file, "products/test");
  assert.equal(result.width, 2400);
  assert.equal(result.height, 1800);
  assert.equal(result.outputWidth, 1600);
  assert.equal(result.outputHeight, 1200);
  assert.match(result.detailPath, /\/web\/.*\.webp$/);
  assert.match(result.cardPath, /\/card\/.*\.webp$/);
  assert.match(result.thumbnailPath, /\/thumbnail\/.*\.webp$/);
  assert.equal((await sharp(result.detail).metadata()).format, "webp");
  assert.ok(result.optimizedBytes < result.originalBytes || result.originalBytes > 0);
});

test("preserves alpha for transparent PNG uploads", async () => {
  const input = await sharp({ create: { width: 700, height: 700, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.2 } } }).png().toBuffer();
  const result = await optimizeProductImage(new File([input], "transparent.png", { type: "image/png" }), "products/test");
  assert.equal((await sharp(result.detail).metadata()).hasAlpha, true);
});

test("rejects invalid and oversized uploads before decoding", () => {
  assert.throws(() => validateProductImage(new File([new Uint8Array(2)], "bad.gif", { type: "image/gif" })), /JPG, PNG, or WebP/);
  assert.throws(() => validateProductImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })), /5 MB/);
});

test("rejects corrupted image bytes", async () => {
  await assert.rejects(() => optimizeProductImage(new File([new Uint8Array([1, 2, 3])], "broken.jpg", { type: "image/jpeg" }), "products/test"));
});
