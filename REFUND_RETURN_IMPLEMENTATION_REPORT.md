# Refund, return and exchange implementation report

Status: Backend foundation only.

Evidence:

- `supabase/migrations/20260718130000_shipping_coupon_returns_foundation.sql` adds `refunds`, `return_requests`, `return_items`, `return_images` and `exchange_items` with status checks, ownership references and immutable-record intent.
- RLS is enabled on all new tables; staff read policies exist and server-side service-role operations are the intended mutation path.

Missing before launch: authorized refund action with over-refund protection, provider-confirmed refund handling, return customer portal and signed guest access, admin approval/rejection/received/restocked workflows, one-time stock restoration, exchange resolution, image upload policy, event/audit history and notifications. The feature must not be represented as operationally available.
