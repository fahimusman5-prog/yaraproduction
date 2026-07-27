# YARA e-commerce and admin-panel audit

Audit date: 2026-07-18
Source of truth: `/Users/usmanfahim08/Library/Mobile Documents/.Trash/yaraproduction` at remote baseline `6dac366`, plus the launch-readiness changes documented in `LAUNCH_READINESS_IMPLEMENTATION.md`.

## 1. Executive summary

The current system is a credible small MVP with connected catalog, regional prices, guest checkout initiation, PayHere notification code, COD, POS, staff authentication, product CRUD, categories, reviews, inventory adjustments, and basic reports. It is not yet a complete self-managed e-commerce operation. Shipping, refunds/returns, promotions, notification automation, customer accounts, advanced permissions, payment operations, and most SEO/CMS controls remain incomplete.

The requested checklist was normalized into 122 auditable units so tightly coupled leaf items could be traced as one end-to-end workflow. Status counts after this inspection:

| Status | Count | Points |
|---|---:|---:|
| Fully Available | 22 | 22.00 |
| Partially Available | 34 | 17.00 |
| UI Only | 6 | 1.50 |
| Backend Only | 8 | 2.00 |
| Broken | 4 | 0.00 |
| Missing | 41 | 0.00 |
| Unable to Verify | 7 | excluded |
| Total | 122 | — |

Scored units: 115. Weighted completion: `42.5 / 115 = 37.0%`. This is a checklist coverage score, not a percentage of source files or revenue readiness.

Production-readiness rating: **NOT READY — CRITICAL BLOCKERS REMAIN**.

Ten most important gaps:

1. No admin-managed shipping zones, fees, estimates, courier, or tracking.
2. No safe refund, return, or exchange workflow.
3. PayHere live initiation/callback and idempotency are not externally verified.
4. No coupon/promotion engine.
5. Customer accounts, addresses, wishlist, recovery, and self-service order history are incomplete.
6. Product media is one image URL; no gallery, alt text, variants, or variant inventory.
7. Notifications and notification logs are absent.
8. Admin permissions remain only admin/staff; no action-level roles or audit log.
9. Product/category route-level SEO and structured data are incomplete.
10. Authenticated mobile and production browser QA remain unverified.

## 2. Current architecture summary

| Area | Evidence |
|---|---|
| Framework | Next.js 16.2.9 App Router, React 19.2.7, TypeScript 5.7, Tailwind CSS; `package.json`. |
| Customer frontend | Client React storefront mounted by `src/modules/storefront/CustomerStorefront.tsx`; screens under `src/customer-pages`; routing in `src/App.tsx`. |
| Admin | App Router pages under `src/app/admin`; feature modules under `src/modules/admin`; server actions in `src/modules/admin/actions.ts`; shell in `src/modules/admin/components/StaffShell.tsx`. |
| POS | Protected `/pos` terminal and history under `src/modules/pos`; server-side sale RPC path. |
| Database | Supabase Postgres; migrations under `supabase/migrations`. |
| Authentication | Supabase Auth and `profiles.role`; `src/lib/supabase/auth.ts`; staff route protection via `src/proxy.ts`. |
| Storage | Supabase Storage product/review buckets with RLS policies; product image upload is server-side. |
| Payments | PayHere hosted checkout/signature verification plus COD; `src/lib/payhere.ts`, `/api/checkout`, `/api/payhere/notify`. |
| Hosting | Vercel-shaped configuration in `vercel.json`; deployment state was not verifiable. |
| Integrations | Supabase, PayHere, WhatsApp links. No email, SMS, courier, analytics, CRM, or marketing provider was found. |
| Environment names | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`, `ORDER_TRACKING_SECRET`, `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, `PAYHERE_SANDBOX`, regional WhatsApp variables. Values were not exposed. |

## 3. Feature availability matrix

The following grouped rows cover all requested checklist areas. Every group was searched across pages, components, actions, routes, migrations, types, environment names, and navigation before classification.

| Module | Feature group | Status | Admin UI | Backend | Database | Storefront | Evidence | Main problem | Priority |
|---|---|---|---|---|---|---|---|---|---|
| Dashboard | Recent orders, POS today, low stock, basic totals | Fully Available | Yes | Yes | Yes | N/A | `AdminDashboardPage.tsx`, `data.ts` | Limited snapshot, no durable analytics aggregates | High |
| Dashboard | Revenue periods, charts, AOV, conversion, refunds, regional sales | Missing | No | No | No | N/A | No matching implementation | Required metrics do not exist | High |
| Products | Add/edit/archive, SKU/barcode, category, descriptions, prices, stock, status, featured | Fully Available | Yes | Yes | Yes | Yes | `ProductForm.tsx`, `actions.ts`, `products` | Connected for current fields | High |
| Products | Delete, draft, duplicate, bulk edit/delete, import/export | Partially Available | Partial | Partial | Partial | Partial | `ProductsTable.tsx`, actions | Archive exists; other workflows absent | High |
| Products | Image gallery, reorder/delete, video, compression, alt text | Partially Available | Single upload | Upload | Single URL | Single image | `image_url`, product form/action | No media model or alt-text field | High |
| Products | Variants, bundles, related products, upsells, cross-sells, pre/backorders | Missing | No | No | No | No | No relationship/variant tables | Single-SKU model only | High |
| Pricing | LKR/AED prices and optional original-price display | Fully Available | Yes | Yes | Yes | Yes | `pricing.ts`, `PriceDisplay.tsx`, product columns | No scheduled sale | High |
| Pricing | Sale scheduling, cost/margin, regional pricing engine, conversion, tax, price history | Missing | No | No | No | No | No fields/tables/actions | Not modeled | High |
| Inventory | Quantity, thresholds, adjustment, movement history, purchase deduction | Partially Available | Yes | Yes | Yes | Yes | `stock_movements`, checkout RPC, inventory UI | Cancellation/refund path now covered only for new admin RPC; refund workflow absent | Critical |
| Inventory | Unlimited, damaged, reserved, warehouses, transfers, suppliers, POs, alerts, variants | Missing | No | No | No | No | No matching tables | Single stock column | High |
| Categories/brands | Category CRUD and product/category relation | Fully Available | Yes | Yes | Yes | Yes | `CategoryManager.tsx`, migrations | No brand model | Medium |
| Categories/brands | Subcategories, category media/SEO/featured/sort, brands | Missing | No | No | No | No | `categories` has name/slug/status | Merchandising model absent | Medium |
| Orders | List/search/status/country filters, details, item/customer/payment data | Fully Available | Yes | Yes | Yes | N/A | `OrdersTable.tsx`, `AdminOrderDetailPage.tsx` | Date/payment filters not present | Critical |
| Orders | Status transition, history, notes, cancellation stock restoration | Partially Available | Yes | Yes | Yes | N/A | `OrderStatusForm.tsx`, `order_events`, RPC migration | Refund/return remains separate | Critical |
| Orders | Invoices, packing slips, labels, courier/tracking, split/merge/duplicate | Missing | No | No | No | N/A | No routes/components/tables | Manual operations required | Critical |
| Orders | Manual order, WhatsApp, bank verification, COD, regional processing | Partially Available | Partial | Partial | Partial | Yes | checkout/WhatsApp/COD paths | WhatsApp is external; bank verification absent | High |
| Customers | Guest customer aggregation and order history | Partially Available | Yes | Yes | Yes | Partial | `AdminCustomersPage.tsx`, `getCustomers` | Read-only inferred profiles | High |
| Customers | Accounts, addresses, wishlist, notes, groups, credit, rewards, export/lifecycle | Missing | No | No | No | UI hints | No durable models/workflows | Customer operations incomplete | High |
| Reviews | Admin moderation and published photo reviews | Fully Available | Yes | Yes | Yes | Yes | review pages/actions/API/storage | No customer submission/verified purchase flow | Medium |
| Reviews | Customer submission, video, reply, spam protection, notifications | Partially Available | Partial | Partial | Partial | Partial | `ProductReviews.tsx`, review tables | Admin-created review model, no customer workflow | High |
| Promotions | Coupons, limits, date/product/category/region targeting | Missing | No | No | No | No | No coupon schema/API/UI | Checkout has no coupon path | Critical |
| Shipping | Zones, rates, thresholds, estimates, courier, tracking, pickup, validation | Missing | No | No | No | Address only | Checkout address fields | Shipping total is not calculated | Critical |
| Payments | PayHere initiation, signature notification, COD, provider fields | Partially Available | Partial | Yes | Yes | Partial | `payhere.ts`, API routes, payment columns | Requires provider/deployment verification | Critical |
| Payments | Payment events, duplicate protection, bank transfer, manual/full/partial refunds | Partially Available | No | Partial | Partial | No | `update_payhere_payment` guard and status fields | No operations UI/refund API/event ledger | Critical |
| Reports | Basic sales/revenue/product/POS CSV report | Partially Available | Yes | Yes | Yes | N/A | `AdminReportsPage.tsx`, `ReportsView.tsx` | In-memory/limited, no PDF/XLSX | High |
| Reports | Profit/tax/expense/inventory/coupon/refund/region/payment reports and analytics pixels | Missing | No | No | No | No | No matching code/integrations | No source data or event pipeline | High |
| Marketing | Hardcoded banner/testimonials/subscribe/WhatsApp links | UI Only | Yes | No | No | Yes | `HomePage.tsx`, `ShopPage.tsx`, `Layout.tsx` | Content/actions are not admin-managed; subscribe has no handler | High |
| Marketing | Email/SMS/WhatsApp campaigns, abandoned cart, loyalty, referral, affiliate, segmentation | Missing | No | No | No | No | No providers/workflows | Absent | Medium |
| SEO | Root metadata, sitemap, robots, basic product SEO fields | Partially Available | Partial | Partial | Partial | Partial | `layout.tsx`, `sitemap.ts`, `robots.ts`, product SEO columns | Route-level metadata/schema incomplete | High |
| SEO | Canonical per product, OG image, JSON-LD, redirects, alt/noindex controls | Missing | No | No | No | Partial | No complete field/rendering path | Absent | High |
| Content | Customer pages, logo, country contacts, locale selector | Partially Available | No | No | Partial | Yes | `customer-pages`, `Layout.tsx`, country context | Code-managed, not CMS-managed | Medium |
| Content | Policies, blog, footer CMS, regional contact settings, favicon | Missing | No | No | No | Partial | No admin content tables/routes | Hardcoded/incomplete | High |
| Regions | Sri Lanka/UAE selection, prices, formatting | Fully Available | Partial | Yes | Yes | Yes | country context, pricing helpers, checkout RPC | Shipping/payment regions not configurable | High |
| Regions | Translation management, multiple regional inventory/payment/shipping | Missing | No | No | No | Partial | No translation/region tables | Absent | Medium |
| Permissions | Admin login, staff route guards, server authorization, RLS/storage policies | Fully Available | Yes | Yes | Yes | N/A | `auth.ts`, migrations, proxy | Current roles only | Critical |
| Permissions | Role matrix, invitations, deactivation, login/activity/audit logs | Missing | No | No | No | N/A | No admin user-management/audit tables | Absent | Critical |
| Notifications | Email/SMS/push/WhatsApp templates, logs, retries, order/stock/review alerts | Missing | No | No | No | No | No provider/queue/log code | Absent | Critical |
| Returns | Customer request portal, approval, exchange, restock, refund history | Missing | No | No | No | No | No return/refund model/routes | Absent | Critical |
| Security | Signed PayHere webhook, validation, server secret boundary, tokenized order lookup | Partially Available | N/A | Yes | Yes | Partial | `payhere.ts`, Zod schemas, `order-tracking.ts` | Live replay/rate-limit testing not verified | Critical |
| Mobile/performance | Responsive classes, table wrappers, loading/error boundaries, build | Partially Available | Partial | Yes | N/A | Partial | `staff.css`, route loading/error files, build | Authenticated device QA and scale testing not complete | High |

## 4. Fully available features

- Staff login and route protection for the current admin/staff roles.
- Product create/edit/archive with current schema fields and validation.
- Category CRUD and product/category relationship.
- Live Supabase catalog retrieval with fallback behavior documented in code.
- Regional Sri Lanka/UAE price display and cart calculation using shared pricing helpers.
- Guest checkout request validation and atomic stock deduction in the order RPC.
- COD order initiation and PayHere hosted checkout construction/signature verification code.
- POS sale path and POS history for the implemented payment methods.
- Inventory adjustment and stock movement history.
- Admin order list/detail and customer/guest aggregation views.
- Admin review creation/edit/moderation and review image storage for the implemented admin workflow.
- Supabase RLS on inspected public tables/storage paths.
- Production build, TypeScript check, and 29 automated tests.

## 5. Partially available features

The largest partial workflows are checkout/payment, orders, inventory, reviews, SEO, reports, customers, regional operations, and mobile. The code is connected for a subset of the path, but the missing pieces are provider verification, shipping computation, refund/return handling, customer self-service, durable reporting, or admin manageability. Recommended next steps are the same as the roadmap in section 15: shipping/payment operations first, then customer/content/promotion/SEO systems.

## 6. UI-only and dead controls

- The storefront “Subscribe” control in `src/customer-pages/ShopPage.tsx` has no submission or persistence path.
- Several customer pages contain hardcoded promotional/testimonial/policy-like content with no admin source.
- The customer login route exists in `src/App.tsx`, but no complete customer-account backend workflow was found.
- Wishlist-looking customer navigation/state is not backed by a wishlist table or API.
- WhatsApp is a real external link, but it is not an order-management workflow inside admin.

These controls should be connected to a real service or clearly disabled/removed before business launch.

## 7. Backend-only features

- `products.seo_title`, `products.seo_description`, and `products.featured` exist and are only partly surfaced.
- `orders.provider_payment_id`, `provider_status_code`, `payment_updated_at`, and `stock_released_at` support payment/stock logic but have no full payment operations screen.
- `stock_movements` provides a durable ledger but has no damaged/reserved/warehouse dimensions.
- `product_reviews` and `product_review_images` are connected to admin and storefront display but not customer submission/verified purchase.
- `order_events` now exists and is written by the guarded status RPC; timeline display remains to be added.
- PayHere notification RPC/state logic exists without a transaction-event log or refund operation.

## 8. Broken or confirmed errors

### Fixed during this implementation: order-status disclosure

Affected route: `/api/orders/[id]`. Before the fix, any valid UUID could retrieve order status using the privileged client. The route now requires an HMAC token and returns a generic 404 for missing/invalid tokens. Relevant files: `src/lib/order-tracking.ts`, checkout route, order route.

### Fixed during this implementation: direct unsafe cancellation

The admin action previously wrote status directly. It now uses `update_admin_order_status`, which restores stock once and records status history. Relevant files: migration, `actions.ts`, `OrderStatusForm.tsx`.

### Confirmed remaining: shipping total is not calculated

Affected page: `src/customer-pages/CheckoutPage.tsx`. Expected: a configured shipping method/fee/estimate. Actual: the page displays “Confirmed when ordering” and the checkout RPC totals products only. Cause: no shipping model or rate engine.

### Confirmed remaining: refunds/returns are absent

Affected areas: admin orders/payment and storefront post-purchase. Expected: refund/return state, provider/manual reconciliation, restocking, and history. Actual: only payment status fields and PayHere failure handling exist.

## 9. Missing admin-panel features

Critical missing groups are shipping configuration, refund/return management, payment transaction/refund UI, coupon engine, notification templates/logs/retries, customer accounts/addresses, product variants/media, role/action permissions, audit logs, and admin-manageable policy/content pages. Growth gaps are analytics pixels, campaigns, loyalty/referrals, advanced reports, SEO redirects/schema, warehouses, suppliers, and purchase orders.

## 10. Storefront versus admin mismatch

| Storefront feature | Visible | Admin manageable | Database connected | Problem |
|---|---|---|---|---|
| Homepage hero/testimonials | Yes | No | No | Hardcoded JSX/content |
| Subscribe/inner circle | Yes | No | No | UI-only control |
| WhatsApp contact/order link | Yes | Partial | No | Number is environment/config driven; messages are not orders in admin |
| Product price/status/stock | Yes | Yes | Yes | Connected for single-SKU model |
| Product SEO/social metadata | Partial | Partial | Partial | Fields exist but route render/schema is incomplete |
| Reviews | Yes when published | Yes | Yes | Admin review model; no customer verified-purchase submission |
| Shipping fee/estimate | No meaningful value | No | No | Checkout defers confirmation |
| Policy/footer content | Partial | No | No | Code-managed/incomplete policy routes |

## 11. Database audit

Tables and relationships were verified through Supabase inspection; details and migration state are in `DATABASE_MIGRATION_REPORT.md`. Good controls include primary keys, unique product SKU/slug/barcode, order-item foreign keys, product/category and review relationships, nonnegative quantity/price checks, RLS on inspected tables, and the new indexed `order_events` table.

Important gaps: no variant/media/coupon/shipping/refund/return/notification/warehouse/supplier/customer-address/admin-audit tables; no durable payment-event ledger; no category hierarchy or brand relation. Existing nullable fields such as `products.category_id`, barcode, original prices, customer user ID, provider payment ID, and stock release timestamp are valid for optional workflows but need explicit UI semantics. Some fields (`original_category`, `image_status`, `pdf_source_page`) are import/provenance fields and have limited storefront use.

The new order transition RPC is security-definer with empty search path, actor-role validation, and restricted grants. Supabase’s remaining security advisor warning is leaked-password protection disabled in Auth, an external setting not changed here.

## 12. Security audit summary

Confirmed good practices: server-only secret client, separate publishable/secret environment names, Zod input validation, signed PayHere notification verification, RLS/storage policies, no secret values in this report, route-level staff checks, and signed guest order lookup after this implementation.

Confirmed fixed: unauthenticated order-status disclosure and direct cancellation bypass of stock restoration.

Likely risks requiring verification: rate limiting/brute-force controls, PayHere replay handling under live traffic, production cookie/session settings, external hosting environment protection, and backup/restore. They are not classified as confirmed vulnerabilities without runtime/config evidence.

Unable to verify: 2FA, CAPTCHA, Auth password-protection setting beyond the advisor result, Vercel protections, and provider-level monitoring.

## 13. Mobile admin-panel audit

Static evidence shows responsive grid classes, `staff-table-wrap` horizontal scrolling, loading/error route boundaries, and touch-sized controls. Admin list pages are partially responsive. Tables still require horizontal scrolling, dense order/product forms need device verification, and authenticated mobile/tablet interaction was not safely testable without credentials. Therefore no page is marked fully mobile-verified.

## 14. Build and quality results

- `npm ci`: passed; warning because runtime Node `26.4.0` differs from requested `24.x`; no vulnerabilities reported by npm audit.
- `npm run typecheck`: passed after clean dependency install.
- `npm run lint`: project script is `tsc --noEmit`; must be rerun before release.
- `npm test`: 29 passed, 0 failed.
- `npm run build`: passed; Next generated admin, storefront, API, `robots.txt`, and `sitemap.xml` routes.
- Broken routes: no build-time broken route was found; live HTTP/browser checks remain.
- Console/runtime errors: not claimed verified without browser session.
- Environment blockers: local secret/payment values were not loaded; Vercel deployment discovery failed; production browser credentials unavailable.

## 15. Recommended implementation roadmap

| Phase | Feature | Why | Dependencies | Complexity | Risk | Order |
|---|---|---|---|---|---|---:|
| 1 | Shipping zones/rates/estimates | Prevent incorrect customer totals | Region model, order totals | Large | High | 1 |
| 1 | Payment event ledger and refund reconciliation | Protect cash and support | PayHere credentials/webhooks | Large | High | 2 |
| 1 | Return/refund operations | Required for support and accounting | Payment/refund policy | Large | High | 3 |
| 1 | Order timeline/tracking/courier fields | Daily fulfillment control | Shipping model | Medium | Medium | 4 |
| 1 | Authenticated browser/mobile smoke tests | Prove release gates | Test credentials/device | Medium | Medium | 5 |
| 2 | Product media, variants, stock by variant | Accurate catalog operations | Media/variant schema | Large | High | 6 |
| 2 | Customer accounts, addresses, order history | Reduce manual support | Auth/account model | Large | High | 7 |
| 2 | Admin role/action permissions and audit log | Reduce privileged-operation risk | Staff model | Large | High | 8 |
| 2 | CMS for policies/home/footer/contact | Business self-service | Content schema | Medium | Medium | 9 |
| 2 | Review customer submission and verified purchase | Trust and moderation | Customer/order identity | Medium | Medium | 10 |
| 3 | Coupons and promotions | Conversion and campaigns | Pricing/order totals | Large | High | 11 |
| 3 | Notification templates/logs/retries | Customer/admin awareness | Email/SMS provider | Large | High | 12 |
| 3 | Analytics/UTM/conversion events | Measurement | GA/Meta/GTM choices | Medium | Medium | 13 |
| 3 | Route-level SEO/schema/redirects | Organic acquisition | Server metadata strategy | Medium | Medium | 14 |
| 4 | Warehouses/suppliers/purchase orders | Scale inventory | Inventory redesign | Large | High | 15 |
| 4 | Loyalty/referrals/affiliate/POS integrations | Growth/enterprise | Customer and marketing models | Large | High | 16 |

## 16. Final decision table

| Feature | Current status | Business impact | Recommendation | Priority |
|---|---|---|---|---|
| Admin authentication/RLS | Fully Available | Protects operations | Retain; verify live | Critical |
| Product CRUD | Fully Available | Enables catalog updates | Retain; add media/variants | High |
| Live catalog | Partially Available | Customer visibility | Verify production environment | Critical |
| LK/UAE pricing | Fully Available | Regional selling | Retain; add regional config | High |
| Guest checkout | Partially Available | Revenue path | Add shipping and safe runtime tests | Critical |
| PayHere | Partially Available | Online payment risk | Complete sandbox/live callback verification | Critical |
| COD | Partially Available | Regional fallback | Add fulfillment controls | High |
| Stock deduction | Partially Available | Oversell risk | Exercise safe transaction tests | Critical |
| Cancellation restoration | Partially Available | Inventory accuracy | Verify RPC with controlled fixture | Critical |
| Order status history | Partially Available | Accountability | Add timeline UI | High |
| Shipping | Missing | Incorrect totals/fulfillment | Implement first | Critical |
| Refunds/returns | Missing | Support/cash risk | Implement before launch | Critical |
| Reviews | Partially Available | Trust | Add customer verified flow | High |
| Coupons | Missing | Marketing limitation | Add after totals model | High |
| Customer accounts | Missing | Support/manual work | Add safe account model | High |
| Product variants | Missing | Catalog limitation | Add before variant products | High |
| Notifications | Missing | Missed orders/support | Add provider and logs | Critical |
| Admin permissions | Missing | Privilege risk | Add roles and audit log | Critical |
| Reports | Partially Available | Limited decisions | Add durable aggregates/exports | High |
| SEO | Partially Available | Acquisition risk | Add route metadata/schema | High |
| CMS content | Missing | Developer dependency | Add policy/home/footer editor | High |
| Mobile admin QA | Unable to Verify | Operational usability | Test authenticated devices | High |
| Analytics | Missing | No conversion visibility | Add event plan/integrations | Medium |
| Backup/restore | Unable to Verify | Recovery risk | Confirm Supabase/Vercel policy | Critical |

## 17. Final conclusion

The business cannot currently manage the whole website without a developer. Safe daily operations are limited to staff login, current product/category updates, basic stock adjustment, reviewing stored orders, POS sales, and the implemented checkout initiation paths after environment verification.

Daily operations that still require technical help include shipping configuration, payment reconciliation/refunds, returns/exchanges, coupons, notifications, customer accounts, content/policy changes, variants/media, role management, analytics, and production deployment/QA.

The highest business risk is the absence of a complete shipping plus refund/return/payment-operations workflow. Implement shipping and payment/refund controls first, then complete authenticated mobile/browser verification. Until those Critical gates pass, the correct release decision is **NOT READY — CRITICAL BLOCKERS REMAIN**.
