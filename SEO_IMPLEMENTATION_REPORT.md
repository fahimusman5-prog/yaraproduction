# YARA Productions technical SEO audit and implementation report

## Before-change audit — 2026-08-02

Repository: `/Users/usmanfahim08/Documents/GitHub/yaraproduction`
Branch: `main`
Previous production commit: `13b23934a2e0a57d1eb363d1da11b8deaaee72a2`
Vercel project: `yaraproduct`
Previous production deployment: `dpl_38KFW5MLkQyQPnseo5NrfkiDm1nP` (Ready)

| Severity | Issue | Affected route | Evidence | Recommended fix | Risk |
|---|---|---|---|---|---|
| Critical | Utility pages were indexable | `/admin`, `/cart`, `/checkout`, `/account` | Live HTML returned `200`, `robots=index, follow`, canonical `/en` | Add route-level `noindex`, exclude from sitemap, block crawling where appropriate | Low |
| Critical | Unknown storefront paths were soft 404s | `/en/not-real` | Live response returned `200` with homepage metadata | Validate known storefront paths and call `notFound()` | Medium |
| High | All storefront paths shared homepage metadata | `/en/shop`, product routes, policy routes | Live title was `YARA | Luxury Skincare` and canonical `/en` for every sampled path | Add reusable localized metadata and route-level product metadata | Medium |
| High | Product pages were client-only to search crawlers | `/en/product/{slug}` | App Router rendered `CustomerStorefront` with `ssr:false` and no server Product schema | Add server route metadata, Product JSON-LD and breadcrumb JSON-LD around the existing storefront | Medium |
| High | Sitemap used daily freshness for every static page | `/sitemap.xml` | Source emitted `changeFrequency: daily` for informational pages | Remove unsupported change frequencies and retain product/concern `updated_at` | Low |
| Medium | Canonicals were inconsistent on concern routes | `/skin-concerns/{slug}` | Source used `https://yaraproduct.com` without `www` | Use `https://www.yaraproduct.com` and localized alternates | Low |
| Medium | Brand wording was abbreviated | Global metadata and visible hero | Live metadata used `YARA`, not consistently `YARA Productions` | Use the exact brand name in metadata, schema and key image alt text | Low |

Live checks also confirmed `robots.txt` and `sitemap.xml` returned HTTP 200, the preferred Vercel domains include both apex and `www`, and the current production deployment was linked to this repository’s `main` commit.

## Implemented

- Reusable localized metadata, canonical, Open Graph, Twitter, private-page robots, Organization, WebSite and BreadcrumbList helpers in `src/lib/seo.ts`.
- Homepage metadata: `YARA Productions | Premium Skincare in Sri Lanka & UAE` with the requested regional description.
- Server-rendered metadata and Product JSON-LD for active localized product routes, using admin-managed SEO fields with safe fallbacks and separate LKR/AED offers. No ratings or reviews are emitted.
- Active product sitemap entries and active skin-concern entries remain database-backed; private, filtered and inactive routes are excluded.
- Robots exclusions for admin, POS, API, payment, cart, checkout, account, login, password reset and token-like utility URLs.
- `notFound()` handling for unknown localized storefront paths and a permanent root redirect to `/en`.
- `noindex, nofollow` metadata for private/admin/payment surfaces.
- Canonical/hreflang normalization to `https://www.yaraproduct.com` with `en`, `si`, `ta`, `ar` and `x-default` alternates where the equivalent route exists.
- Logo alt text now uses `YARA Productions`; the existing homepage H1 was left unchanged to avoid altering unrelated testimonial content in the shared homepage component.
- Six focused SEO tests added; the full suite now passes.

## Validation

- TypeScript: passed.
- SEO tests: 6 passed.
- Full tests: 130 passed, 0 failed.
- `git diff --check`: passed.
- Production build: passed with elevated process permissions; Next.js 16.2.12 compiled, typechecked and generated all routes.
- Secret scan: pending final pre-commit review; no credentials are introduced by the SEO changes.

## Remaining limitations

- This implementation does not prove Google indexing or rankings.
- Arabic `lang`/`dir` is applied by the existing locale provider after hydration; a future route-level HTML shell could make it present in the first response.
- Live post-deployment validation, sitemap URL count, redirects for every host variant, and Google Rich Results validation require the new deployment to be Ready.
- Core Web Vitals require field data or a browser performance run; no design or commerce behavior was changed speculatively.
- The homepage H1 can be refined in a separate content-reviewed change after the existing testimonial copy is verified.
- Search Console and Business Profile actions require the owner’s accounts and cannot be completed from code.

## Manual launch steps

1. In Google Search Console, verify `www.yaraproduct.com` using an authorized DNS TXT record or the owner’s existing verification method; do not add a fabricated token.
2. Submit `https://www.yaraproduct.com/sitemap.xml` under Sitemaps.
3. Inspect the homepage, shop, one active product, one localized route and one private route; request indexing only for public pages.
4. In Google Business Profile, claim or verify the official YARA Productions profile, use the canonical website URL, add verified Sri Lanka/UAE service areas and official phone numbers, and complete the platform’s verification process.
5. Add only official social profiles already configured in the project. Backlink acquisition and social-profile administration remain manual activities.
