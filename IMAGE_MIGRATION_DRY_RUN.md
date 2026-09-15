# Product image migration dry run

Run date: 2026-09-15
Supabase project: `yhywklzutqzwafulnpcu`

This is a read-only live inventory obtained through the connected Supabase SQL integration. No Storage uploads, deletes, or product updates were performed.

| Measure | Result |
| --- | ---: |
| Active products | 52 |
| Active products with images | 52 |
| Fully optimized products | 0 |
| Product-image Storage objects | 54 |
| Product-image Storage bytes | 105,093,048 (~105.1MB) |
| Matched image average | 1,942,175 bytes (~1.94MB) |
| Matched image minimum | 115,264 bytes |
| Matched image maximum | 2,634,409 bytes |

The current objects are primarily PNG masters served directly through `image_url`; the largest observed object is approximately 2.63MB. The checked-in Node backfill utility remains default-safe (`DRY_RUN=true`) and is ready to process the actual image bytes when a server-side Supabase secret is available in the execution environment. The live SQL dry run above intentionally did not download or rewrite any object.
