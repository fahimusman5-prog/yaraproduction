-- The six-argument checkout function is the only supported order-creation API.
-- Removing the legacy overload prevents internal callers from bypassing
-- idempotency, authenticated ownership, and product-level shipping snapshots.
drop function if exists public.create_storefront_order(jsonb, text, text, jsonb);
