create or replace function public.create_storefront_order_with_coupon(
  p_customer jsonb,
  p_country text,
  p_payment_method text,
  p_items jsonb,
  p_idempotency_key uuid,
  p_customer_user_id uuid default null,
  p_coupon_code text default null
)
returns table(order_id uuid, order_number text, total_amount numeric, currency text, created boolean, discount_amount numeric, coupon_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_created record;
  v_order public.orders%rowtype;
  v_coupon public.coupons%rowtype;
  v_code text := upper(nullif(trim(coalesce(p_coupon_code, '')), ''));
  v_usage integer;
  v_customer_usage integer;
  v_eligible_subtotal numeric(12,2);
  v_discount numeric(12,2) := 0;
  v_has_product_restrictions boolean;
  v_has_category_restrictions boolean;
begin
  select * into v_created from public.create_storefront_order(
    p_customer, p_country, p_payment_method, p_items, p_idempotency_key, p_customer_user_id
  );
  select * into v_order from public.orders where id = v_created.order_id for update;
  if not v_created.created then
    if coalesce(v_order.coupon_code, '') <> coalesce(v_code, '') then
      raise exception using errcode = '23505', message = 'Idempotent retry must use the original coupon.';
    end if;
    return query select v_order.id, v_order.order_number, v_order.total_amount, v_order.currency, false, v_order.discount_amount, v_order.coupon_code;
    return;
  end if;
  if v_code is null then
    return query select v_order.id, v_order.order_number, v_order.total_amount, v_order.currency, true, 0::numeric, ''::text;
    return;
  end if;

  select * into v_coupon from public.coupons where upper(code) = v_code for update;
  if not found or not v_coupon.active then
    raise exception using errcode = 'P0002', message = 'Coupon is invalid or inactive.';
  end if;
  if v_coupon.starts_at is not null and now() < v_coupon.starts_at
     or v_coupon.ends_at is not null and now() >= v_coupon.ends_at then
    raise exception using errcode = '23514', message = 'Coupon is outside its valid dates.';
  end if;
  if v_coupon.country_scope not in ('both', p_country) then
    raise exception using errcode = '23514', message = 'Coupon is not valid in this region.';
  end if;
  if v_order.subtotal_amount < v_coupon.minimum_order_amount then
    raise exception using errcode = '23514', message = 'Order does not meet the coupon minimum.';
  end if;
  select count(*) into v_usage from public.coupon_redemptions where coupon_id = v_coupon.id;
  if v_coupon.usage_limit is not null and v_usage >= v_coupon.usage_limit then
    raise exception using errcode = '23514', message = 'Coupon usage limit has been reached.';
  end if;
  select count(*) into v_customer_usage from public.coupon_redemptions
    where coupon_id = v_coupon.id
      and (customer_user_id is not distinct from p_customer_user_id
        or lower(customer_email) = lower(trim(p_customer->>'email')));
  if v_customer_usage >= v_coupon.per_customer_limit then
    raise exception using errcode = '23514', message = 'Coupon customer usage limit has been reached.';
  end if;

  select exists(select 1 from public.coupon_products where coupon_id = v_coupon.id) into v_has_product_restrictions;
  select exists(select 1 from public.coupon_categories where coupon_id = v_coupon.id) into v_has_category_restrictions;
  select coalesce(sum(oi.subtotal), 0) into v_eligible_subtotal
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  where oi.order_id = v_order.id
    and (
      (not v_has_product_restrictions and not v_has_category_restrictions)
      or exists (select 1 from public.coupon_products cp where cp.coupon_id = v_coupon.id and cp.product_id = oi.product_id)
      or exists (select 1 from public.coupon_categories cc where cc.coupon_id = v_coupon.id and cc.category_id = p.category_id)
    );
  if v_eligible_subtotal <= 0 then
    raise exception using errcode = '23514', message = 'Coupon does not apply to these products.';
  end if;
  v_discount := case when v_coupon.discount_type = 'percentage'
    then round(v_eligible_subtotal * v_coupon.discount_value / 100, 2)
    else least(v_coupon.discount_value, v_eligible_subtotal)
  end;
  if v_coupon.maximum_discount is not null then v_discount := least(v_discount, v_coupon.maximum_discount); end if;
  v_discount := least(v_discount, v_order.subtotal_amount);

  update public.orders set discount_amount = v_discount, coupon_code = v_code,
    total_amount = subtotal_amount - v_discount + shipping_fee
  where id = v_order.id
  returning * into v_order;
  insert into public.coupon_redemptions(coupon_id, order_id, customer_email, customer_user_id, discount_amount)
  values (v_coupon.id, v_order.id, lower(trim(p_customer->>'email')), p_customer_user_id, v_discount);
  return query select v_order.id, v_order.order_number, v_order.total_amount, v_order.currency, true, v_discount, v_code;
end;
$$;

revoke all on function public.create_storefront_order_with_coupon(jsonb, text, text, jsonb, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.create_storefront_order_with_coupon(jsonb, text, text, jsonb, uuid, uuid, text) to service_role;
revoke execute on function public.create_storefront_order(jsonb, text, text, jsonb, uuid, uuid) from service_role;
