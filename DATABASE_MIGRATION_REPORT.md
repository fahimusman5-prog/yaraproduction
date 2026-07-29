# Database migration drift report

## Verified target

- Repository: `/Users/usmanfahim08/Documents/GitHub/yaraproduction`
- Supabase project: `yhywklzutqzwafulnpcu`
- Region: `ap-southeast-1`
- PostgreSQL: 17
- Production data was not reset, deleted, or reseeded.

## Drift identified

The hosted migration history contained five commerce migrations that were not
present in the repository:

- `shipping_coupon_returns_foundation`
- `test_yara_rpc_syntax`
- `shipping_coupon_order_rpc`
- `shipping_coupon_order_rpc_v3`
- `remove_test_yara_rpc`

Those hosted migrations had created shipping zones/methods, coupons and
redemptions, return requests/items/images, exchanges, and refunds. The
repository therefore could not reproduce the hosted schema on a fresh database.

## Reconciliation

`20260729004652_reconcile_live_commerce_schema.sql` is the canonical additive
reconciliation. It:

- creates every hosted commerce table when absent;
- adds coupon product/category restrictions;
- adds return and refund status history;
- adds missing return/refund operational columns;
- creates constraints and indexes;
- enables RLS on every exposed table;
- adds customer-owned return access and staff management policies; and
- grants Data API privileges explicitly, independently of Supabase's changing
  automatic-exposure defaults.

The migration was applied successfully to the existing project. Existing tables
and records were preserved by `create table if not exists`, additive
`add column if not exists`, and deliberate constraint replacement.

## Remaining validation

Before release, run all local migrations against an empty Supabase development
database and compare the resulting schema with production. Production remains
the authoritative data source; this report does not authorize a database reset.
