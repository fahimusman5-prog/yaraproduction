# Product image recovery — 4 October 2026

## Root cause and live evidence

Verified project: YARAPRODUCTIONS / yhywklzutqzwafulnpcu. Read-only investigation; no database or bucket changes.

Working screenshot example: YARA Pinkish Night Cream. Affected example: YARA For Men Complete Care Combo.

Both records store complete HTTPS public URLs in `products.image_url`, using the same project, bucket and `products/<uuid>.png` format. Both have null card/thumbnail/original variant fields. Night Cream references `products/648a0ff2-226d-4ae7-a362-263abe42bd40.png`; the Combo references `products/5caca09f-2f0b-4e75-b45a-c098373f6e0b.png`. Both objects exist, have image/png MIME types, and return HTTP 200 directly (1,953,495 and 2,080,723 bytes respectively).

Production `/_next/image?url=<stored URL>&w=640&q=75` returns HTTP 402 and `OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED` for both products, plus Beetroot Lip Balm, Akkar Fassi and Pastil Sun Block. A fresh production shop session also falls back for the previously working Night Cream. Thus the current failure is the production optimizer service's payment requirement, not different database formats or storage permissions. Earlier selective success is consistent with cached image responses, but historical cache state cannot be proven from screenshots.

The card immediately substituted a placeholder after any optimizer error. ProductImage had no shared recovery, so the gallery left a blank image area. Next remotePatterns already permit the actual public Supabase URLs.

All 52 active assigned image URLs passed HTTP HEAD checks. Storage-object joins found every assigned product object present. Product-images is public; private return-evidence remains private. Storage writes remain staff restricted. Schema has image_url/image_card_url/image_thumbnail_url/original_image_url, with no database gallery field. No malformed paths, JSON arrays, old hostnames or signed product URLs were found.

## Changes

- src/components/ProductImage.tsx: keep normal Next optimization; on error try the unchanged direct source once, then the existing SVG placeholder. Source changes reset recovery through a keyed child. Placeholder failures never loop. Existing size/fill/sizes/priority/classes stay intact. Diagnostics are development only.
- src/lib/product-image-source.ts: trim and validate the existing supported public sources and local assets; bounded fallback state transitions. Reject arbitrary strings, unsupported hosts, credentials and private URLs.
- src/components/ProductCard.tsx: let the shared component finish its recovery before marking a terminal failure; remove the card's premature source substitution.
- src/modules/admin/components/ProductsTable.tsx: use the shared image component at the existing thumbnail dimensions.
- tests/product-image-source.test.mjs: cover legacy/new public URLs, invalid sources and finite recovery.

No redesign, data migration, hardcoded product image substitutions, cache-busting parameters, new storage probes or per-product API calls. Existing legacy PNG/JPEG URLs remain supported. Optimizer failure may require downloading the original legacy file; successful optimized loads incur no additional image request. Existing HTTP cache headers remain effective.

## Upload pipeline

The existing upload action validates and optimizes a file, confirms each original/detail/card/thumbnail storage upload, then stores canonical public URLs. It uses immutable UUID paths and one-year storage cache headers. Failed storage uploads prevent product save. This pipeline needs no format change. Generated WebP variants passed the image-processing tests. Authenticated remote create/edit/upload reproduction was not performed, so this is code and processing verification rather than a claim of a new live upload.

## Verification

- npm run lint: pass.
- npm run typecheck: pass.
- npm run build: pass.
- git diff --check: pass.
- 210 tests pass with a temporary Node resolver loader. Bare npm test exposes an existing extensionless product-image-config import in product-images.ts under Node's strip-types runner; the temporary loader resolves .ts imports without changing application imports or configuration.
- Normal local Next optimizer request: HTTP 200.
- Local production-build browser QA used a read-only snapshot of the actual production catalog and a temporary proxy forcing optimizer HTTP 402, matching the measured production failure. Local Supabase catalog access returned 503; no production DB writes were used for fixtures.
- Desktop 1440px, tablet 768px and mobile 390px image checks: affected cards, previous working images, featured cards, gallery, related cards, search, category data and cart/checkout thumbnails recover. Discount pricing and unavailable purchase restrictions remain intact.
- Local-only no-image and missing-file fixtures render the existing placeholder. A multi-image fixture using the existing fallback gallery exercised image switching. No gallery field exists on live product records.
- No new runtime exceptions observed. Expected optimizer failures are intentionally present in the forced-failure test. Local review/shipping API failures are attributable to the unavailable local backend.
- Shop/product/cart checks showed no horizontal overflow. Checkout at 390px has an unrelated existing overflow; no layout changes were made.
- Admin thumbnail integration compiles; authenticated rendered admin QA was not available.

## Delivery status

Implemented in the local checkout, not committed/pushed/deployed. Production's optimizer payment requirement remains an external hosting/account condition. The application now recovers from that condition after deployment; restoring the optimizer service itself requires the hosting account's billing/usage issue to be resolved.
