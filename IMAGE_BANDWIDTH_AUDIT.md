# YARA image bandwidth audit

## Audit status

This report was created before implementation. The repository does not contain a production Supabase URL/key, and outbound DNS is unavailable in this workspace, so the live `product-images` object inventory and Supabase egress dashboard cannot be queried from here. The measurements below are verified local assets plus code-path findings; the backfill utility added with this change performs the live inventory in dry-run mode when production environment variables are available.

## Root causes found

1. Storefront product imagery is rendered with plain `<img>` tags in the client-rendered React Router storefront. `next/image` is not used for product cards, product detail, home featured products, cart, checkout, account order details, admin product lists, or review galleries.
2. The admin action uploads the administrator's original JPEG/PNG/WebP directly to the public `product-images` bucket. No resize, WebP conversion, quality policy, metadata, or cache-control is applied.
3. Product cards, cart, checkout, account, and admin thumbnails request the same product URL regardless of their much smaller rendered dimensions. A product grid can therefore download master-sized files for 300px cards.
4. Product replacement currently removes the previous object after the database update. That is unsafe for immutable caching and breaks the requested preserve-original migration rule.
5. The current upload path uses a new random filename but does not separate master and web assets. Existing `image_url` values can also be local fallback images or external design-preview URLs, so a blind URL rewrite would be unsafe.
6. `next.config.ts` has no Supabase `remotePatterns`; even a conversion to `next/image` would require configuration and would not help the current custom client app unless the rendered components were migrated deliberately.
7. The catalog API is cached for 60 seconds, but image object responses are not given an application-controlled immutable cache policy.

## Verified local measurements

The repository's supplied product/fallback PNGs are 1254×1254 and range from 1,846,328 to 1,853,842 bytes each. The supplied hero/editorial PNGs are 1023–1254px wide and range from 1,960,611 to 2,549,392 bytes. These are not proof of the live Storage inventory, but they demonstrate the current pattern: premium-sized PNG files are used directly in web contexts.

Representative verified local product assets:

| Asset | Dimensions | Format | Bytes |
| --- | ---: | --- | ---: |
| `public/images/yara-saffron-face-wash.png` | 1254×1254 | PNG RGB | 1,846,328 |
| `public/images/yara-night-cream.png` | 1254×1254 | PNG RGB | 1,853,842 |

The same two verified assets were processed locally with the production pipeline settings (WebP quality 88/86, no enlargement):

| Asset | Detail WebP | Card WebP | Thumbnail WebP | Total derivatives |
| --- | ---: | ---: | ---: | ---: |
| Saffron Face Wash | 134,200 | 72,864 | 17,604 | 224,668 |
| Night Cream | 119,920 | 58,804 | 15,588 | 194,312 |

That is approximately 92.7–93.5% smaller for detail delivery, 96.1–96.8% smaller for card delivery, and 99.0–99.2% smaller for thumbnail delivery on these verified assets. Actual Supabase product results will be reported by the dry-run utility once production environment variables are supplied.

For a 40-product catalog at the verified ~1.85MB average, one full catalog image pass is approximately 74.0MB before browser cache reuse. At 100 passes that is approximately 7.40GB. This is an estimate from repository assets, not a claim about current Supabase production totals.

## Target architecture

New admin uploads will be processed server-side in the existing Node.js Server Action using the already available `sharp` runtime, with a 1600px long-edge cap and quality 88 WebP output. The original upload is stored untouched under `products/{productId}/original/{uuid}.{ext}` and the storefront derivative under `products/{productId}/web/{uuid}.webp`. The database keeps the existing `image_url` field as the storefront derivative and adds nullable `original_image_url` for the master.

The storefront will use a small file-backed `ProductImage` wrapper around `next/image` for remote Supabase URLs and local fallback URLs. It will provide accurate `sizes` per context, lazy-load non-LCP images, and use explicit width/height/aspect-ratio contracts. Cart and checkout use a 160px source-size hint; cards use the actual responsive grid width; detail uses a 1600px source; thumbnails use 160px. Review and return-evidence images remain separate concerns and are not rewritten by the product pipeline.

## Safe rollout

- New uploads use the new two-object pipeline immediately after deployment.
- Existing `image_url` objects are not changed automatically.
- `scripts/backfill-product-images.mjs` inventories active products and supports `DRY_RUN=true` (the default). It skips already optimized URLs, preserves originals, verifies generated output, and only updates the database when explicitly run with `DRY_RUN=false`.
- The script never deletes Storage objects. A failed database update leaves both objects for retry and investigation.

## Next implementation steps

1. Add the nullable backward-compatible database field and storage cache policy migration.
2. Add server-side validation/optimization and replace the unsafe delete-on-replacement behavior.
3. Convert product storefront/admin surfaces to the responsive image wrapper.
4. Add dry-run backfill and tests for processing, failures, fallback, and URL/versioning behavior.
5. Run dry-run and local checks; no production record backfill will be run in this task.
