create index if not exists coupon_redemptions_customer_user_id_idx on public.coupon_redemptions(customer_user_id);
create index if not exists coupons_created_by_idx on public.coupons(created_by);
create index if not exists exchange_items_requested_product_id_idx on public.exchange_items(requested_product_id);
create index if not exists exchange_items_return_request_id_idx on public.exchange_items(return_request_id);
create index if not exists notification_events_order_id_idx on public.notification_events(order_id);
create index if not exists order_events_actor_id_idx on public.order_events(actor_id);
create index if not exists orders_shipping_method_id_idx on public.orders(shipping_method_id);
create index if not exists orders_shipping_zone_id_idx on public.orders(shipping_zone_id);
create index if not exists refunds_actor_id_idx on public.refunds(actor_id);
create index if not exists return_images_return_request_id_idx on public.return_images(return_request_id);
create index if not exists return_items_order_item_id_idx on public.return_items(order_item_id);
create index if not exists return_items_return_request_id_idx on public.return_items(return_request_id);
create index if not exists return_requests_customer_user_id_idx on public.return_requests(customer_user_id);

drop policy if exists order_events_staff_select on public.order_events;
create policy order_events_staff_select on public.order_events for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
drop policy if exists order_events_staff_insert on public.order_events;
create policy order_events_staff_insert on public.order_events for insert to authenticated
with check (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));

drop policy if exists shipping_zones_staff_select on public.shipping_zones;
create policy shipping_zones_staff_select on public.shipping_zones for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
drop policy if exists shipping_methods_staff_select on public.shipping_methods;
create policy shipping_methods_staff_select on public.shipping_methods for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
drop policy if exists coupons_staff_select on public.coupons;
create policy coupons_staff_select on public.coupons for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
drop policy if exists coupon_redemptions_staff_select on public.coupon_redemptions;
create policy coupon_redemptions_staff_select on public.coupon_redemptions for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
drop policy if exists refunds_staff_select on public.refunds;
create policy refunds_staff_select on public.refunds for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
drop policy if exists return_requests_staff_select on public.return_requests;
create policy return_requests_staff_select on public.return_requests for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
drop policy if exists return_items_staff_select on public.return_items;
create policy return_items_staff_select on public.return_items for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
drop policy if exists return_images_staff_select on public.return_images;
create policy return_images_staff_select on public.return_images for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
drop policy if exists exchange_items_staff_select on public.exchange_items;
create policy exchange_items_staff_select on public.exchange_items for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','staff')));
