drop policy if exists staff_manage_shipping_product_rates
  on public.shipping_product_rates;
drop policy if exists staff_read_shipping_product_rates
  on public.shipping_product_rates;
create policy staff_read_shipping_product_rates
  on public.shipping_product_rates
  for select
  to authenticated
  using ((select private.is_staff()));
revoke insert, update, delete
  on public.shipping_product_rates
  from authenticated;
grant select on public.shipping_product_rates to authenticated;
