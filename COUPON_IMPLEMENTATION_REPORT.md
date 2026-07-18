# Coupon implementation report

Status: Partially Available.

Evidence:

- `supabase/migrations/20260718130000_shipping_coupon_returns_foundation.sql` adds `coupons` and `coupon_redemptions`, including fixed/percentage, region, date, minimum, maximum, usage and per-customer fields.
- `src/modules/admin/AdminCouponsPage.tsx` and `/admin/coupons` provide coupon creation and listing.
- `src/customer-pages/CheckoutPage.tsx` provides coupon entry.
- `src/app/api/checkout/route.ts` accepts a coupon code.

The current production RPC deliberately rejects coupon-bearing checkout with a clear error rather than silently ignoring the code. Transactional validation, redemption, usage reporting, edit/deactivate controls and successful discount snapshots still require completion. No production coupon was created.
