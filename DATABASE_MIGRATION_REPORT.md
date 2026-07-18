# Database migration report

## Supabase project verification

- Project reference: `yhywklzutqzwafulnpcu`
- Region: `ap-southeast-1`
- PostgreSQL: 17.6.1.121
- Project health: healthy at inspection time
- All listed public commerce tables had RLS enabled.

## Migration state

The live project contained the repository migrations through `dynamic_skin_concern_management`, followed by the applied launch-readiness migrations:

- `launch_readiness_order_controls`
- `revoke_order_transition_grants`

The connector assigned live migration versions `20260718062241` and the subsequent migration version for the grant repair. No destructive or data-seeding migration was executed.

## Schema findings

Existing tables: `profiles`, `categories`, `products`, `orders`, `order_items`, `pos_sales`, `pos_sale_items`, `stock_movements`, `skin_concerns`, `product_skin_concerns`, `product_reviews`, and `product_review_images`. Storage metadata showed two buckets.

Important existing gaps: products have one image URL and no variant/media/alt-text model; orders have no shipping-rate, courier, refund, return, or payment-event tables; profiles support only `admin`, `staff`, and `customer`; there is no coupon, notification, CMS, warehouse, supplier, or analytics model.

## Applied controls

`order_events` is an RLS-enabled, indexed audit table. `update_admin_order_status` locks the order, authorizes the actor against `profiles`, validates statuses, prevents reopening cancelled orders or moving delivered orders backwards, records an event, and restores stock exactly once on cancellation. Its exposed execution grants were removed from `anon`, `authenticated`, and `public`; only `service_role` is granted.

## Remaining database work

Add shipping methods/zones, payment events/refunds, returns, coupons, product media/variants, customer addresses, notifications, admin audit logs, and appropriate indexes only with a reviewed domain model and backfill plan. Do not add nullable fields solely to make UI controls appear functional.
