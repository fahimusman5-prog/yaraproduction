-- Replace zone-based new-order delivery with one fixed regional fee.
-- Legacy zones and methods remain intact only for historical order references.

insert into public.delivery_settings (
  region_code, currency, delivery_fee, is_enabled, is_configured
)
values
  ('LK', 'LKR', 500, true, true),
  ('AE', 'AED', 25, true, true)
on conflict (region_code) do update
set
  currency = excluded.currency,
  delivery_fee = excluded.delivery_fee,
  is_enabled = true,
  is_configured = true,
  updated_at = now();

create or replace function public.touch_delivery_setting_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists delivery_settings_touch_updated_at
  on public.delivery_settings;
create trigger delivery_settings_touch_updated_at
before update on public.delivery_settings
for each row execute function public.touch_delivery_setting_updated_at();

comment on table public.shipping_zones is
  'Legacy delivery routing retained for historical order compatibility; not used by new storefront checkout.';
comment on table public.shipping_methods is
  'Legacy delivery methods retained for historical order compatibility; not used by new storefront checkout.';
comment on table public.shipping_product_rates is
  'Legacy product delivery overrides retained for history; not used by new storefront checkout.';

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
  v_setting public.delivery_settings%rowtype;
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_region_code text;
  v_currency text;
  v_subtotal numeric(12,2) := 0;
  v_delivery numeric(12,2);
  v_payment_fee numeric(12,2) := 0;
  v_unit_price numeric(12,2);
  v_quantity integer;
  v_available boolean;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023',
      message = 'Idempotency key is required.';
  end if;
  perform pg_advisory_xact_lock(
    hashtextextended(p_idempotency_key::text, 0)
  );
  select * into v_existing
  from public.orders
  where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.country <> p_country
       or lower(v_existing.customer_email) <>
          lower(trim(p_customer->>'email')) then
      raise exception using errcode = '23505',
        message = 'Idempotency key is already in use.';
    end if;
    return query
      select v_existing.id, v_existing.order_number,
        v_existing.total_amount, v_existing.currency, false;
    return;
  end if;

  if p_country not in ('sri-lanka', 'uae') then
    raise exception using errcode = '22023',
      message = 'Invalid country.';
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
     or nullif(trim(p_customer->>'city'), '') is null then
    raise exception using errcode = '23514',
      message = 'Complete customer and delivery details are required.';
  end if;
  if p_customer_user_id is not null
     and not exists (
       select 1 from public.profiles
       where id = p_customer_user_id and role = 'customer'
     ) then
    raise exception using errcode = '23503',
      message = 'Customer account not found.';
  end if;

  v_region_code :=
    case when p_country = 'sri-lanka' then 'LK' else 'AE' end;
  v_currency :=
    case when p_country = 'sri-lanka' then 'LKR' else 'AED' end;

  select * into v_setting
  from public.delivery_settings
  where region_code = v_region_code
  for share;
  if not found or not v_setting.is_configured
     or not v_setting.is_enabled or v_setting.delivery_fee is null then
    raise exception using errcode = '23514',
      message = 'Delivery is temporarily unavailable for this country.';
  end if;
  if v_setting.currency <> v_currency then
    raise exception using errcode = '23514',
      message = 'Delivery currency does not match the selected region.';
  end if;
  v_delivery := v_setting.delivery_fee;

  for v_item in
    select value from jsonb_array_elements(p_items)
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
    if v_unit_price is null or v_unit_price < 0 then
      raise exception using errcode = '23514',
        message = 'A regional product price is unavailable.';
    end if;
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

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
    v_region_code,
    v_currency,
    v_subtotal,
    v_delivery,
    v_currency,
    0,
    v_payment_fee,
    v_subtotal + v_delivery + v_payment_fee,
    p_payment_method,
    'pending',
    'pending',
    now(),
    p_idempotency_key,
    null,
    null,
    'Fixed countrywide delivery',
    true
  );

  for v_item in
    select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;
    v_unit_price := case
      when p_country = 'sri-lanka' then v_product.price_lkr
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
    select v_order_id, v_order_number,
      v_subtotal + v_delivery + v_payment_fee,
      v_currency, true;
end;
$$;

revoke all on function public.create_storefront_order(
  jsonb, text, text, jsonb, uuid, uuid
) from public, anon, authenticated, service_role;
