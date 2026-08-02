-- Remove legacy duplicate staff policies. The replacement policies use the
-- canonical private.is_staff() check and preserve the same staff access.
drop policy if exists coupon_redemptions_staff_select on public.coupon_redemptions;
drop policy if exists coupons_staff_select on public.coupons;
drop policy if exists exchange_items_staff_select on public.exchange_items;
drop policy if exists refunds_staff_select on public.refunds;
drop policy if exists return_images_staff_select on public.return_images;
drop policy if exists return_items_staff_select on public.return_items;
drop policy if exists return_requests_staff_select on public.return_requests;
drop policy if exists shipping_methods_staff_select on public.shipping_methods;
drop policy if exists shipping_zones_staff_select on public.shipping_zones;

-- Cover the exact foreign keys reported by the Performance Advisor. These are
-- idempotent and do not alter data, constraints, or checkout semantics.
create index if not exists account_deletion_requests_processed_by_idx
  on public.account_deletion_requests (processed_by);
create index if not exists coupon_categories_category_id_idx
  on public.coupon_categories (category_id);
create index if not exists coupon_products_product_id_idx
  on public.coupon_products (product_id);
create index if not exists refund_items_order_item_id_fk_idx
  on public.refund_items (order_item_id);
create index if not exists refund_status_history_actor_id_idx
  on public.refund_status_history (actor_id);
create index if not exists refund_status_history_refund_id_idx
  on public.refund_status_history (refund_id);
create index if not exists refunds_return_request_id_idx
  on public.refunds (return_request_id);
create index if not exists return_images_uploaded_by_idx
  on public.return_images (uploaded_by);
create index if not exists return_items_reviewed_by_idx
  on public.return_items (reviewed_by);
create index if not exists return_status_history_actor_id_idx
  on public.return_status_history (actor_id);
create index if not exists shipping_audit_history_actor_id_idx
  on public.shipping_audit_history (actor_id);
create index if not exists shipping_product_rates_product_id_idx
  on public.shipping_product_rates (product_id);
