import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const bucket = "product-images";
const dryRun = process.env.DRY_RUN !== "false";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
if (!supabaseUrl || !secretKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SECRET_KEY.");
const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

const publicUrl = (path) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
const output = async (input, size, quality) => sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).rotate().resize({ width: size, height: size, fit: "inside", withoutEnlargement: true }).webp({ quality, alphaQuality: quality, effort: 4 }).toBuffer();

const { data: products, error } = await supabase.from("products").select("id,name,image_url,image_card_url,image_thumbnail_url,original_image_url").not("image_url", "is", null).order("name");
if (error) throw error;
const summary = { total: products?.length ?? 0, skipped: 0, planned: 0, migrated: 0, failed: 0 };
console.log(`[backfill] mode=${dryRun ? "DRY_RUN" : "WRITE"} products=${summary.total}`);

for (const product of products ?? []) {
  if (product.image_url?.includes("/web/") && product.image_card_url?.includes("/card/") && product.image_thumbnail_url?.includes("/thumbnail/")) {
    summary.skipped += 1;
    console.log(`[backfill] skip optimized ${product.id} ${product.name}`);
    continue;
  }
  if (!product.image_url || product.image_url.startsWith("/")) {
    summary.skipped += 1;
    console.log(`[backfill] skip non-fetchable ${product.id} ${product.name}`);
    continue;
  }
  try {
    const started = Date.now();
    const response = await fetch(product.original_image_url || product.image_url);
    if (!response.ok) throw new Error(`source HTTP ${response.status}`);
    const input = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
    if (!metadata.width || !metadata.height) throw new Error("source dimensions unavailable");
    const [detail, card, thumbnail] = await Promise.all([output(input, 1600, 88), output(input, 800, 88), output(input, 320, 86)]);
    const assetId = `backfill-${randomUUID()}`;
    const paths = {
      detail: `products/${product.id}/web/${assetId}.webp`,
      card: `products/${product.id}/card/${assetId}.webp`,
      thumbnail: `products/${product.id}/thumbnail/${assetId}.webp`,
    };
    console.log(`[backfill] plan ${product.id} original=${input.byteLength} detail=${detail.byteLength} card=${card.byteLength} thumbnail=${thumbnail.byteLength} dimensions=${metadata.width}x${metadata.height} durationMs=${Date.now() - started}`);
    summary.planned += 1;
    if (dryRun) continue;
    for (const [path, body] of [[paths.detail, detail], [paths.card, card], [paths.thumbnail, thumbnail]]) {
      const uploaded = await supabase.storage.from(bucket).upload(path, body, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
      if (uploaded.error) throw uploaded.error;
    }
    const updated = await supabase.from("products").update({ image_url: publicUrl(paths.detail), image_card_url: publicUrl(paths.card), image_thumbnail_url: publicUrl(paths.thumbnail), original_image_url: product.original_image_url || product.image_url }).eq("id", product.id);
    if (updated.error) throw updated.error;
    summary.migrated += 1;
  } catch (failure) {
    summary.failed += 1;
    console.error(`[backfill] failed ${product.id} ${product.name}: ${failure instanceof Error ? failure.message : String(failure)}`);
  }
}
console.log(`[backfill] summary ${JSON.stringify(summary)}`);
if (summary.failed) process.exitCode = 1;
