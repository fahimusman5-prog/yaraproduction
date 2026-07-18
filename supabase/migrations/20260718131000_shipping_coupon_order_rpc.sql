create or replace function public.create_storefront_order_with_shipping(p_customer jsonb, p_country text, p_payment_method text, p_items jsonb, p_shipping_method_id uuid default null, p_coupon_code text default null)
returns table(order_id uuid, order_number text, total_amount numeric, currency text)
language plpgsql security definer set search_path to '' as 'declare
  v_base record;
  v_method public.shipping_methods%rowtype;
  v_zone public.shipping_zones%rowtype;
begin
  if p_country not in (''sri-lanka'',''uae'') then raise exception ''Invalid country''; end if;
  select sm.* into v_method from public.shipping_methods sm join public.shipping_zones sz on sz.id = sm.shipping_zone_id where sm.active and sz.active and sz.country_code = case when p_country = ''sri-lanka'' then ''LK'' else ''AE'' end and (p_shipping_method_id is null or sm.id = p_shipping_method_id) order by sm.sort_order, sm.id limit 1;
  if not found then raise exception ''Shipping is not configured for this region.''; end if;
  select * into v_zone from public.shipping_zones where id = v_method.shipping_zone_id;
  if v_method.currency <> case when p_country = ''sri-lanka'' then ''LKR'' else ''AED'' end then raise exception ''Shipping currency does not match the region''; end if;
  select * into v_base from public.create_storefront_order(p_customer, p_country, p_payment_method, p_items);
  update public.orders set subtotal_amount = v_base.total_amount, shipping_zone_id = v_zone.id, shipping_method_id = v_method.id, shipping_method_name = v_method.name, shipping_fee = case when v_method.free_shipping_threshold is not null and v_base.total_amount >= v_method.free_shipping_threshold then 0 else v_method.fee end, shipping_currency = v_method.currency, total_amount = v_base.total_amount + case when v_method.free_shipping_threshold is not null and v_base.total_amount >= v_method.free_shipping_threshold then 0 else v_method.fee end, estimated_delivery_date = current_date + v_method.estimated_max_days where id = v_base.order_id;
  if p_coupon_code is not null and trim(p_coupon_code) <> '''' then raise exception ''Coupon validation is not available until promotion configuration is enabled.''; end if;
  return query select v_base.order_id, v_base.order_number, (select total_amount from public.orders where id = v_base.order_id), v_base.currency;
end;';

revoke all on function public.create_storefront_order_with_shipping(jsonb,text,text,jsonb,uuid,text) from public, anon, authenticated;
grant execute on function public.create_storefront_order_with_shipping(jsonb,text,text,jsonb,uuid,text) to service_role;
