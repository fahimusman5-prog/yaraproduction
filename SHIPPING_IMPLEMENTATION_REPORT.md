# Shipping implementation report

Date: 2026-07-18

Status: Partially Available / blocked for launch activation.

Evidence:

- `supabase/migrations/20260718130000_shipping_coupon_returns_foundation.sql` adds `shipping_zones`, `shipping_methods`, order shipping snapshots, fees, currencies, thresholds, estimates, courier and tracking fields.
- `supabase/migrations/20260718131000_shipping_coupon_order_rpc.sql` adds the service-role-only server-side order creation path.
- `src/app/api/checkout/options/route.ts` reads active methods by region.
- `src/app/api/checkout/route.ts` passes the selected method to the server-side RPC.
- `src/customer-pages/CheckoutPage.tsx` displays delivery methods, estimates, fee and coupon entry.
- `src/modules/admin/AdminShippingPage.tsx` and the `/admin/shipping` route provide zone and method configuration.

Supabase production verification confirmed all shipping tables exist and `create_storefront_order_with_shipping` is not executable by `anon` or `authenticated`. No shipping zones or methods were seeded or activated because approved Sri Lanka/UAE fees were not supplied. Checkout therefore remains safely unavailable until an administrator configures an active method. Courier assignment, tracking updates, shipped/delivered actions and customer tracking UI remain incomplete.
