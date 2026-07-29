-- Regional delivery is one order-level charge. Legacy product and method fees
-- remain for historical compatibility but are no longer used by checkout.

create table if not exists public.delivery_settings (
  id uuid primary key default gen_random_uuid(),
  region_code text not null unique
    check (region_code in ('LK', 'AE')),
  currency text not null
    check (
      (region_code = 'LK' and currency = 'LKR')
      or (region_code = 'AE' and currency = 'AED')
    ),
  delivery_fee numeric(12,2)
    check (delivery_fee is null or delivery_fee >= 0),
  is_enabled boolean not null default false,
  is_configured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_configured or delivery_fee is not null),
  check (not is_enabled or is_configured)
);

alter table public.delivery_settings enable row level security;

drop policy if exists delivery_settings_public_read_active
  on public.delivery_settings;
create policy delivery_settings_public_read_active
  on public.delivery_settings
  for select
  to anon, authenticated
  using (is_enabled and is_configured);

drop policy if exists delivery_settings_admin_read
  on public.delivery_settings;
create policy delivery_settings_admin_read
  on public.delivery_settings
  for select
  to authenticated
  using ((select private.is_admin()));

drop policy if exists delivery_settings_admin_insert
  on public.delivery_settings;
create policy delivery_settings_admin_insert
  on public.delivery_settings
  for insert
  to authenticated
  with check ((select private.is_admin()));

drop policy if exists delivery_settings_admin_update
  on public.delivery_settings;
create policy delivery_settings_admin_update
  on public.delivery_settings
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on public.delivery_settings from anon, authenticated;
grant select on public.delivery_settings to anon;
grant select, insert, update on public.delivery_settings to authenticated;

insert into public.delivery_settings (
  region_code,
  currency,
  delivery_fee,
  is_enabled,
  is_configured
)
values
  ('LK', 'LKR', 500, true, true),
  ('AE', 'AED', null, false, false)
on conflict (region_code) do update
set
  currency = excluded.currency,
  delivery_fee = case
    when public.delivery_settings.region_code = 'LK'
      and not public.delivery_settings.is_configured then 500
    else public.delivery_settings.delivery_fee
  end,
  is_enabled = case
    when public.delivery_settings.region_code = 'LK'
      and not public.delivery_settings.is_configured then true
    else public.delivery_settings.is_enabled
  end,
  is_configured = case
    when public.delivery_settings.region_code = 'LK' then true
    else public.delivery_settings.is_configured
  end,
  updated_at = now();

alter table public.shipping_audit_history
  drop constraint if exists shipping_audit_history_entity_type_check;
alter table public.shipping_audit_history
  add constraint shipping_audit_history_entity_type_check
  check (entity_type in ('zone', 'method', 'product_rate', 'delivery_setting'));

alter table public.orders
  add column if not exists payment_fee numeric(12,2) not null default 0
    check (payment_fee >= 0),
  add column if not exists region_code text
    check (region_code is null or region_code in ('LK', 'AE'));

update public.orders
set region_code = case
  when country = 'sri-lanka' then 'LK'
  when country = 'uae' then 'AE'
  else region_code
end
where region_code is null;

-- Ensure Sri Lanka has a selectable nationwide method without introducing
-- another monetary source. The authoritative fee comes from delivery_settings.
do $$
declare
  v_zone_id uuid;
begin
  select id into v_zone_id
  from public.shipping_zones
  where country_code = 'LK'
    and is_regional_fallback
    and archived_at is null
  order by created_at
  limit 1;

  if v_zone_id is null then
    insert into public.shipping_zones (
      name,
      country_code,
      region_name,
      zone_kind,
      match_values,
      cod_available,
      minimum_order_amount,
      is_regional_fallback,
      active,
      sort_order
    ) values (
      'Sri Lanka nationwide delivery',
      'LK',
      'All Sri Lanka districts',
      'regional_fallback',
      '{}'::text[],
      true,
      0,
      true,
      true,
      900
    )
    returning id into v_zone_id;
  else
    update public.shipping_zones
    set
      active = true,
      cod_available = true,
      updated_at = now()
    where id = v_zone_id;
  end if;

  if not exists (
    select 1
    from public.shipping_methods
    where shipping_zone_id = v_zone_id
      and name = 'Standard delivery'
      and archived_at is null
  ) then
    insert into public.shipping_methods (
      shipping_zone_id,
      name,
      description,
      fee,
      currency,
      free_shipping_threshold,
      estimated_min_days,
      estimated_max_days,
      cod_available,
      minimum_order_amount,
      active,
      sort_order
    ) values (
      v_zone_id,
      'Standard delivery',
      'Delivery timing will be confirmed with the customer.',
      null,
      'LKR',
      null,
      0,
      0,
      true,
      0,
      true,
      900
    );
  end if;
end;
$$;

create or replace function public.get_configured_shipping_options(
  p_country text,
  p_city text,
  p_subtotal numeric,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_country_code text;
  v_currency text;
  v_city text := lower(trim(coalesce(p_city, '')));
  v_setting public.delivery_settings%rowtype;
  v_zone public.shipping_zones%rowtype;
  v_method public.shipping_methods%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_subtotal numeric(12,2) := 0;
  v_options jsonb := '[]'::jsonb;
begin
  if p_country not in ('sri-lanka', 'uae') then
    raise exception using errcode = '22023', message = 'Invalid country.';
  end if;
  if v_city = '' then
    return jsonb_build_object(
      'options', '[]'::jsonb,
      'deliveryConfigured', false,
      'deliveryEnabled', false,
      'deliveryFee', null,
      'reason', 'Enter a district, emirate, or city.'
    );
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023',
      message = 'At least one product is required.';
  end if;

  v_country_code := case when p_country = 'sri-lanka' then 'LK' else 'AE' end;
  v_currency := case when p_country = 'sri-lanka' then 'LKR' else 'AED' end;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity <= 0 or v_quantity > 1000 then
      raise exception using errcode = '23514',
        message = 'Invalid product quantity.';
    end if;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and status = 'active';
    if not found then
      raise exception using errcode = 'P0002',
        message = 'A product is unavailable.';
    end if;
    if (p_country = 'sri-lanka' and not v_product.shipping_available_lkr)
       or (p_country = 'uae' and not v_product.shipping_available_aed) then
      raise exception using errcode = '23514',
        message = v_product.name || ' is not available in your region.';
    end if;
    v_subtotal := v_subtotal + (
      case when p_country = 'sri-lanka'
        then v_product.price_lkr
        else v_product.price_aed
      end * v_quantity
    );
  end loop;

  select * into v_setting
  from public.delivery_settings
  where region_code = v_country_code;

  if not found or not v_setting.is_configured
     or not v_setting.is_enabled or v_setting.delivery_fee is null then
    return jsonb_build_object(
      'options', '[]'::jsonb,
      'deliveryConfigured', coalesce(v_setting.is_configured, false),
      'deliveryEnabled', coalesce(v_setting.is_enabled, false),
      'deliveryFee', null,
      'currency', v_currency,
      'feeChargedOnce', true,
      'reason', case
        when v_country_code = 'AE'
          then 'Delivery fee will be confirmed. Please use WhatsApp ordering while UAE delivery is being configured.'
        else 'Delivery is temporarily unavailable. Please contact YARA for assistance.'
      end
    );
  end if;

  for v_zone in
    select z.*
    from public.shipping_zones z
    where z.country_code = v_country_code
      and z.active
      and z.archived_at is null
      and v_subtotal >= z.minimum_order_amount
      and (
        lower(z.region_name) = v_city
        or exists (
          select 1
          from unnest(z.match_values) as match_value
          where lower(match_value) = v_city
        )
        or z.is_regional_fallback
      )
    order by z.is_regional_fallback, z.sort_order, z.name
  loop
    for v_method in
      select m.*
      from public.shipping_methods m
      where m.shipping_zone_id = v_zone.id
        and m.currency = v_currency
        and m.active
        and m.archived_at is null
        and v_subtotal >= m.minimum_order_amount
      order by m.sort_order, m.name
    loop
      v_options := v_options || jsonb_build_array(jsonb_build_object(
        'zoneId', v_zone.id,
        'zoneName', v_zone.name,
        'methodId', v_method.id,
        'methodName', v_method.name,
        'description', v_method.description,
        'fee', v_setting.delivery_fee,
        'currency', v_setting.currency,
        'estimatedMinDays', v_method.estimated_min_days,
        'estimatedMaxDays', v_method.estimated_max_days,
        'codAvailable', v_zone.cod_available and v_method.cod_available,
        'feeChargedOnce', true
      ));
    end loop;
    if jsonb_array_length(v_options) > 0 then
      exit;
    end if;
  end loop;

  return jsonb_build_object(
    'options', v_options,
    'deliveryConfigured', true,
    'deliveryEnabled', true,
    'deliveryFee', v_setting.delivery_fee,
    'currency', v_setting.currency,
    'feeChargedOnce', true,
    'reason', case
      when jsonb_array_length(v_options) = 0
        then 'No active delivery method matches this address. Please contact YARA for assistance.'
      else null
    end
  );
end;
$$;

revoke all on function public.get_configured_shipping_options(
  text, text, numeric, jsonb
) from public, anon, authenticated;
grant execute on function public.get_configured_shipping_options(
  text, text, numeric, jsonb
) to service_role;

create or replace function public.create_storefront_order(
  p_customer jsonb,
  p_country text,
  p_payment_method text,
  p_items jsonb,
  p_idempotency_key uuid,
  p_customer_user_id uuid default null
)
returns table(
  order_id uuid,
  order_number text,
  total_amount numeric,
  currency text,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_method public.shipping_methods%rowtype;
  v_zone public.shipping_zones%rowtype;
  v_setting public.delivery_settings%rowtype;
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_method_id uuid;
  v_zone_id uuid;
  v_country_code text;
  v_currency text;
  v_city text := lower(trim(coalesce(p_customer->>'city', '')));
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
  v_payment_fee numeric(12,2) := 0;
  v_unit_price numeric(12,2);
  v_quantity integer;
  v_available boolean;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023',
      message = 'Idempotency key is required.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  select * into v_existing
  from public.orders
  where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.country <> p_country
       or lower(v_existing.customer_email) <>
          lower(trim(p_customer->>'email'))
       or v_existing.shipping_method_id is distinct from
          nullif(p_customer->>'shippingMethodId', '')::uuid then
      raise exception using errcode = '23505',
        message = 'Idempotency key is already in use.';
    end if;
    return query
      select v_existing.id, v_existing.order_number,
        v_existing.total_amount, v_existing.currency, false;
    return;
  end if;

  if p_country not in ('sri-lanka', 'uae') then
    raise exception using errcode = '22023', message = 'Invalid country.';
  end if;
  if p_payment_method not in ('cod', 'payhere') then
    raise exception using errcode = '22023',
      message = 'Invalid payment method.';
  end if;
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023',
      message = 'At least one product is required.';
  end if;
  if nullif(trim(p_customer->>'name'), '') is null
     or nullif(trim(p_customer->>'email'), '') is null
     or nullif(trim(p_customer->>'phone'), '') is null
     or nullif(trim(p_customer->>'address'), '') is null
     or v_city = ''
     or nullif(trim(p_customer->>'shippingMethodId'), '') is null
     or nullif(trim(p_customer->>'shippingZoneId'), '') is null then
    raise exception using errcode = '23514',
      message = 'Complete customer and delivery details are required.';
  end if;
  if p_customer_user_id is not null
     and not exists (
       select 1
       from public.profiles
       where id = p_customer_user_id and role = 'customer'
     ) then
    raise exception using errcode = '23503',
      message = 'Customer account not found.';
  end if;

  v_country_code :=
    case when p_country = 'sri-lanka' then 'LK' else 'AE' end;
  v_currency :=
    case when p_country = 'sri-lanka' then 'LKR' else 'AED' end;

  select * into v_setting
  from public.delivery_settings
  where region_code = v_country_code
  for share;
  if not found or not v_setting.is_configured
     or not v_setting.is_enabled or v_setting.delivery_fee is null then
    raise exception using errcode = '23514',
      message = case
        when v_country_code = 'AE'
          then 'Delivery fee will be confirmed. Please use WhatsApp ordering while UAE delivery is being configured.'
        else 'Delivery is temporarily unavailable. Please contact YARA for assistance.'
      end;
  end if;
  if v_setting.currency <> v_currency then
    raise exception using errcode = '23514',
      message = 'Delivery currency does not match the selected region.';
  end if;
  v_shipping := v_setting.delivery_fee;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity <= 0 or v_quantity > 1000 then
      raise exception using errcode = '23514',
        message = 'Invalid product quantity.';
    end if;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;
    if not found or v_product.status <> 'active' then
      raise exception using errcode = 'P0002',
        message = 'A product is unavailable';
    end if;
    if v_product.stock_quantity < v_quantity then
      raise exception using errcode = '23514',
        message = 'Insufficient stock for ' || v_product.name;
    end if;
    if p_country = 'sri-lanka' then
      v_unit_price := v_product.price_lkr;
      v_available := v_product.shipping_available_lkr;
    else
      v_unit_price := v_product.price_aed;
      v_available := v_product.shipping_available_aed;
    end if;
    if not v_available then
      raise exception using errcode = '23514',
        message = v_product.name || ' is not available in your region.';
    end if;
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  v_method_id := (p_customer->>'shippingMethodId')::uuid;
  v_zone_id := (p_customer->>'shippingZoneId')::uuid;
  select * into v_zone
  from public.shipping_zones
  where id = v_zone_id
    and country_code = v_country_code
    and active
    and archived_at is null
    and v_subtotal >= minimum_order_amount
    and (
      lower(region_name) = v_city
      or exists (
        select 1
        from unnest(shipping_zones.match_values) as match_value
        where lower(match_value) = v_city
      )
      or is_regional_fallback
    )
  for share;
  if not found then
    raise exception using errcode = '23514',
      message = 'The selected delivery zone is not valid for this address.';
  end if;
  select * into v_method
  from public.shipping_methods
  where id = v_method_id
    and shipping_zone_id = v_zone.id
    and currency = v_currency
    and active
    and archived_at is null
    and v_subtotal >= minimum_order_amount
  for share;
  if not found then
    raise exception using errcode = '23514',
      message = 'The selected delivery method is unavailable.';
  end if;
  if p_payment_method = 'cod'
     and (not v_zone.cod_available or not v_method.cod_available) then
    raise exception using errcode = '23514',
      message = 'Cash on delivery is not available for this delivery zone.';
  end if;

  v_order_id := gen_random_uuid();
  v_order_number :=
    'YARA-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS')
    || '-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 6));
  insert into public.orders (
    id,
    order_number,
    customer_user_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    shipping_city,
    shipping_postal_code,
    shipping_address_snapshot,
    country,
    region_code,
    currency,
    subtotal_amount,
    shipping_fee,
    shipping_currency,
    discount_amount,
    payment_fee,
    total_amount,
    payment_method,
    payment_status,
    order_status,
    terms_accepted_at,
    idempotency_key,
    shipping_zone_id,
    shipping_method_id,
    shipping_method_name,
    cod_available_snapshot
  ) values (
    v_order_id,
    v_order_number,
    p_customer_user_id,
    left(trim(p_customer->>'name'), 200),
    left(lower(trim(p_customer->>'email')), 320),
    left(trim(p_customer->>'phone'), 50),
    left(trim(p_customer->>'address'), 500),
    left(trim(p_customer->>'city'), 160),
    left(coalesce(trim(p_customer->>'postalCode'), ''), 40),
    p_customer,
    p_country,
    v_country_code,
    v_currency,
    v_subtotal,
    v_shipping,
    v_currency,
    0,
    v_payment_fee,
    v_subtotal + v_shipping + v_payment_fee,
    p_payment_method,
    'pending',
    'pending',
    now(),
    p_idempotency_key,
    v_zone.id,
    v_method.id,
    v_method.name,
    v_zone.cod_available and v_method.cod_available
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;
    v_unit_price := case
      when p_country = 'sri-lanka'
        then v_product.price_lkr
      else v_product.price_aed
    end;
    insert into public.order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      subtotal,
      shipping_fee,
      shipping_calculation_type,
      free_shipping,
      product_shipping_fee
    ) values (
      v_order_id,
      v_product.id,
      v_quantity,
      v_unit_price,
      v_unit_price * v_quantity,
      0,
      'per_line',
      false,
      0
    );
    update public.products
    set stock_quantity = v_product.stock_quantity - v_quantity
    where id = v_product.id;
    insert into public.stock_movements (
      product_id,
      movement_type,
      quantity_change,
      previous_stock,
      new_stock,
      reference_id
    ) values (
      v_product.id,
      'online_order',
      -v_quantity,
      v_product.stock_quantity,
      v_product.stock_quantity - v_quantity,
      v_order_id
    );
  end loop;

  return query
    select
      v_order_id,
      v_order_number,
      v_subtotal + v_shipping + v_payment_fee,
      v_currency,
      true;
end;
$$;

revoke all on function public.create_storefront_order(
  jsonb, text, text, jsonb, uuid, uuid
) from public, anon, authenticated, service_role;

create or replace function public.create_storefront_order_with_coupon(
  p_customer jsonb,
  p_country text,
  p_payment_method text,
  p_items jsonb,
  p_idempotency_key uuid,
  p_customer_user_id uuid default null,
  p_coupon_code text default null
)
returns table (
  order_id uuid,
  order_number text,
  total_amount numeric,
  currency text,
  created boolean,
  discount_amount numeric,
  coupon_code text
)
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
  select * into v_created
  from public.create_storefront_order(
    p_customer,
    p_country,
    p_payment_method,
    p_items,
    p_idempotency_key,
    p_customer_user_id
  );
  select * into v_order
  from public.orders
  where id = v_created.order_id
  for update;

  if not v_created.created then
    if coalesce(v_order.coupon_code, '') <> coalesce(v_code, '') then
      raise exception using errcode = '23505',
        message = 'Idempotent retry must use the original coupon.';
    end if;
    return query
      select v_order.id, v_order.order_number, v_order.total_amount,
        v_order.currency, false, v_order.discount_amount,
        v_order.coupon_code;
    return;
  end if;
  if v_code is null then
    return query
      select v_order.id, v_order.order_number, v_order.total_amount,
        v_order.currency, true, 0::numeric, ''::text;
    return;
  end if;

  select * into v_coupon
  from public.coupons
  where upper(code) = v_code
  for update;
  if not found or not v_coupon.active then
    raise exception using errcode = 'P0002',
      message = 'Coupon is invalid or inactive.';
  end if;
  if (v_coupon.starts_at is not null and now() < v_coupon.starts_at)
     or (v_coupon.ends_at is not null and now() >= v_coupon.ends_at) then
    raise exception using errcode = '23514',
      message = 'Coupon is outside its valid dates.';
  end if;
  if v_coupon.country_scope not in ('both', p_country) then
    raise exception using errcode = '23514',
      message = 'Coupon is not valid in this region.';
  end if;
  if v_order.subtotal_amount < v_coupon.minimum_order_amount then
    raise exception using errcode = '23514',
      message = 'Order does not meet the coupon minimum.';
  end if;
  select count(*) into v_usage
  from public.coupon_redemptions
  where coupon_id = v_coupon.id;
  if v_coupon.usage_limit is not null
     and v_usage >= v_coupon.usage_limit then
    raise exception using errcode = '23514',
      message = 'Coupon usage limit has been reached.';
  end if;
  select count(*) into v_customer_usage
  from public.coupon_redemptions
  where coupon_id = v_coupon.id
    and (
      customer_user_id is not distinct from p_customer_user_id
      or lower(customer_email) = lower(trim(p_customer->>'email'))
    );
  if v_customer_usage >= v_coupon.per_customer_limit then
    raise exception using errcode = '23514',
      message = 'Coupon customer usage limit has been reached.';
  end if;

  select exists(
    select 1 from public.coupon_products where coupon_id = v_coupon.id
  ) into v_has_product_restrictions;
  select exists(
    select 1 from public.coupon_categories where coupon_id = v_coupon.id
  ) into v_has_category_restrictions;
  select coalesce(sum(oi.subtotal), 0) into v_eligible_subtotal
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  where oi.order_id = v_order.id
    and (
      (not v_has_product_restrictions and not v_has_category_restrictions)
      or exists (
        select 1 from public.coupon_products cp
        where cp.coupon_id = v_coupon.id
          and cp.product_id = oi.product_id
      )
      or exists (
        select 1 from public.coupon_categories cc
        where cc.coupon_id = v_coupon.id
          and cc.category_id = p.category_id
      )
    );
  if v_eligible_subtotal <= 0 then
    raise exception using errcode = '23514',
      message = 'Coupon does not apply to these products.';
  end if;
  v_discount := case
    when v_coupon.discount_type = 'percentage'
      then round(v_eligible_subtotal * v_coupon.discount_value / 100, 2)
    else least(v_coupon.discount_value, v_eligible_subtotal)
  end;
  if v_coupon.maximum_discount is not null then
    v_discount := least(v_discount, v_coupon.maximum_discount);
  end if;
  v_discount := least(v_discount, v_order.subtotal_amount);

  update public.orders
  set
    discount_amount = v_discount,
    coupon_code = v_code,
    total_amount =
      subtotal_amount - v_discount + shipping_fee + payment_fee
  where id = v_order.id
  returning * into v_order;

  insert into public.coupon_redemptions (
    coupon_id,
    order_id,
    customer_email,
    customer_user_id,
    discount_amount
  ) values (
    v_coupon.id,
    v_order.id,
    lower(trim(p_customer->>'email')),
    p_customer_user_id,
    v_discount
  );

  return query
    select v_order.id, v_order.order_number, v_order.total_amount,
      v_order.currency, true, v_discount, v_code;
end;
$$;

revoke all on function public.create_storefront_order_with_coupon(
  jsonb, text, text, jsonb, uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.create_storefront_order_with_coupon(
  jsonb, text, text, jsonb, uuid, uuid, text
) to service_role;
