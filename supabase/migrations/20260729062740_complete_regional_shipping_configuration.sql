alter table public.shipping_zones
  add column if not exists zone_kind text not null default 'zone',
  add column if not exists match_values text[] not null default '{}'::text[],
  add column if not exists cod_available boolean not null default true,
  add column if not exists minimum_order_amount numeric(12,2) not null default 0,
  add column if not exists is_regional_fallback boolean not null default false,
  add column if not exists archived_at timestamptz;

alter table public.shipping_zones
  drop constraint if exists shipping_zones_zone_kind_check;
alter table public.shipping_zones
  add constraint shipping_zones_zone_kind_check
  check (zone_kind in ('district', 'emirate', 'city', 'zone', 'regional_fallback'));
alter table public.shipping_zones
  drop constraint if exists shipping_zones_minimum_order_check;
alter table public.shipping_zones
  add constraint shipping_zones_minimum_order_check
  check (minimum_order_amount >= 0);

alter table public.shipping_methods
  alter column fee drop not null,
  add column if not exists cod_available boolean not null default true,
  add column if not exists minimum_order_amount numeric(12,2) not null default 0,
  add column if not exists archived_at timestamptz;
alter table public.shipping_methods
  drop constraint if exists shipping_methods_minimum_order_check;
alter table public.shipping_methods
  add constraint shipping_methods_minimum_order_check
  check (minimum_order_amount >= 0);

create table if not exists public.shipping_product_rates (
  id uuid primary key default gen_random_uuid(),
  shipping_method_id uuid not null
    references public.shipping_methods(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  fee numeric(12,2) check (fee is null or fee >= 0),
  free_shipping boolean not null default false,
  calculation_type text not null default 'per_line'
    check (calculation_type in ('per_line', 'per_unit')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (shipping_method_id, product_id),
  check (free_shipping or fee is not null)
);

create table if not exists public.shipping_audit_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null
    check (entity_type in ('zone', 'method', 'product_rate')),
  entity_id uuid not null,
  action text not null
    check (action in ('created', 'updated', 'activated', 'deactivated', 'archived')),
  before_state jsonb,
  after_state jsonb,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists shipping_zones_matching_idx
  on public.shipping_zones(country_code, active, is_regional_fallback)
  where archived_at is null;
create index if not exists shipping_methods_available_idx
  on public.shipping_methods(shipping_zone_id, active, sort_order)
  where archived_at is null;
create index if not exists shipping_product_rates_method_product_idx
  on public.shipping_product_rates(shipping_method_id, product_id)
  where active and archived_at is null;
create index if not exists shipping_audit_entity_idx
  on public.shipping_audit_history(entity_type, entity_id, created_at desc);

alter table public.shipping_product_rates enable row level security;
alter table public.shipping_audit_history enable row level security;

drop policy if exists staff_manage_shipping_product_rates
  on public.shipping_product_rates;
create policy staff_manage_shipping_product_rates
  on public.shipping_product_rates for all to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));
drop policy if exists staff_view_shipping_audit_history
  on public.shipping_audit_history;
create policy staff_view_shipping_audit_history
  on public.shipping_audit_history for select to authenticated
  using ((select private.is_staff()));

grant select, insert, update, delete on public.shipping_product_rates
  to authenticated;
grant select on public.shipping_audit_history to authenticated;

alter table public.orders
  add column if not exists shipping_zone_id uuid
    references public.shipping_zones(id) on delete set null,
  add column if not exists shipping_method_id uuid
    references public.shipping_methods(id) on delete set null,
  add column if not exists cod_available_snapshot boolean not null default true;

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
)
values
  (
    'Sri Lanka regional fallback — business rate required',
    'LK',
    'All other Sri Lanka districts',
    'regional_fallback',
    '{}'::text[],
    false,
    0,
    true,
    false,
    900
  ),
  (
    'Dubai — business rate required',
    'AE',
    'Dubai',
    'emirate',
    array['dubai'],
    false,
    0,
    false,
    false,
    100
  ),
  (
    'UAE regional fallback — business rate required',
    'AE',
    'All other UAE emirates',
    'regional_fallback',
    '{}'::text[],
    false,
    0,
    true,
    false,
    900
  )
on conflict do nothing;

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
  v_zone public.shipping_zones%rowtype;
  v_method public.shipping_methods%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_rate public.shipping_product_rates%rowtype;
  v_quantity integer;
  v_fee numeric(12,2);
  v_total numeric(12,2);
  v_product_fees numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_needs_method_fee boolean;
  v_product_rate_found boolean;
  v_options jsonb := '[]'::jsonb;
begin
  if p_country not in ('sri-lanka', 'uae') then
    raise exception using errcode = '22023', message = 'Invalid country.';
  end if;
  if v_city = '' then
    return jsonb_build_object('options', '[]'::jsonb, 'reason', 'Enter a district, emirate, or city.');
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'At least one product is required.';
  end if;
  v_country_code := case when p_country = 'sri-lanka' then 'LK' else 'AE' end;
  v_currency := case when p_country = 'sri-lanka' then 'LKR' else 'AED' end;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity <= 0 or v_quantity > 1000 then
      raise exception using errcode = '23514', message = 'Invalid product quantity.';
    end if;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid and status = 'active';
    if not found then
      raise exception using errcode = 'P0002', message = 'A product is unavailable.';
    end if;
    v_subtotal := v_subtotal + (
      case when p_country = 'sri-lanka'
        then v_product.price_lkr else v_product.price_aed end
      * v_quantity
    );
  end loop;

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
        and m.active
        and m.archived_at is null
        and m.fee is not null
        and v_subtotal >= m.minimum_order_amount
      order by m.sort_order, m.fee, m.name
    loop
      v_total := 0;
      v_product_fees := 0;
      v_needs_method_fee := false;
      for v_item in select value from jsonb_array_elements(p_items)
      loop
        v_quantity := (v_item->>'quantity')::integer;
        select * into v_product
        from public.products
        where id = (v_item->>'product_id')::uuid and status = 'active';
        if not found then
          raise exception using errcode = 'P0002', message = 'A product is unavailable.';
        end if;
        if (p_country = 'sri-lanka' and not v_product.shipping_available_lkr)
           or (p_country = 'uae' and not v_product.shipping_available_aed) then
          raise exception using errcode = '23514',
            message = v_product.name || ' is not available in your region.';
        end if;

        select * into v_product_rate
        from public.shipping_product_rates r
        where r.shipping_method_id = v_method.id
          and r.product_id = v_product.id
          and r.active and r.archived_at is null;
        v_product_rate_found := found;

        if (p_country = 'sri-lanka' and v_product.free_shipping_lkr)
           or (p_country = 'uae' and v_product.free_shipping_aed) then
          v_fee := 0;
        elsif p_country = 'sri-lanka' and v_product.shipping_fee_lkr is not null then
          v_fee := v_product.shipping_fee_lkr
            * case when v_product.shipping_calculation_lkr = 'per_unit' then v_quantity else 1 end;
        elsif p_country = 'uae' and v_product.shipping_fee_aed is not null then
          v_fee := v_product.shipping_fee_aed
            * case when v_product.shipping_calculation_aed = 'per_unit' then v_quantity else 1 end;
        elsif v_product_rate_found and v_product_rate.free_shipping then
          v_fee := 0;
        elsif v_product_rate_found and v_product_rate.fee is not null then
          v_fee := v_product_rate.fee
            * case when v_product_rate.calculation_type = 'per_unit' then v_quantity else 1 end;
        else
          v_fee := 0;
          v_needs_method_fee := true;
        end if;
        v_product_fees := v_product_fees + v_fee;
      end loop;

      v_total := case
        when v_method.free_shipping_threshold is not null
          and v_subtotal >= v_method.free_shipping_threshold then 0
        else v_product_fees
          + case when v_needs_method_fee then v_method.fee else 0 end
      end;
      v_options := v_options || jsonb_build_array(jsonb_build_object(
        'zoneId', v_zone.id,
        'zoneName', v_zone.name,
        'methodId', v_method.id,
        'methodName', v_method.name,
        'description', v_method.description,
        'fee', v_total,
        'currency', v_currency,
        'estimatedMinDays', v_method.estimated_min_days,
        'estimatedMaxDays', v_method.estimated_max_days,
        'codAvailable', v_zone.cod_available and v_method.cod_available
      ));
    end loop;
    if jsonb_array_length(v_options) > 0 then exit; end if;
  end loop;
  return jsonb_build_object(
    'options', v_options,
    'reason', case
      when jsonb_array_length(v_options) = 0
        then 'No active delivery method matches this address. The business must configure a valid rate.'
      else null
    end
  );
end;
$$;

revoke all on function public.get_configured_shipping_options(text, text, numeric, jsonb)
  from public, anon, authenticated;
grant execute on function public.get_configured_shipping_options(text, text, numeric, jsonb)
  to service_role;

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
  v_rate public.shipping_product_rates%rowtype;
  v_method public.shipping_methods%rowtype;
  v_zone public.shipping_zones%rowtype;
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_method_id uuid;
  v_zone_id uuid;
  v_currency text;
  v_city text := lower(trim(coalesce(p_customer->>'city', '')));
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_unit_price numeric(12,2);
  v_product_shipping numeric(12,2);
  v_line_shipping numeric(12,2);
  v_quantity integer;
  v_calculation text;
  v_free boolean;
  v_available boolean;
  v_rate_found boolean;
  v_method_fee_applied boolean := false;
  v_free_threshold_met boolean := false;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'Idempotency key is required.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  select * into v_existing
  from public.orders
  where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.country <> p_country
       or lower(v_existing.customer_email) <> lower(trim(p_customer->>'email'))
       or v_existing.shipping_method_id is distinct from
         nullif(p_customer->>'shippingMethodId', '')::uuid then
      raise exception using errcode = '23505',
        message = 'Idempotency key is already in use.';
    end if;
    return query
      select v_existing.id, v_existing.order_number, v_existing.total_amount,
        v_existing.currency, false;
    return;
  end if;
  if p_country not in ('sri-lanka', 'uae') then
    raise exception using errcode = '22023', message = 'Invalid country.';
  end if;
  if p_payment_method not in ('cod', 'payhere') then
    raise exception using errcode = '22023', message = 'Invalid payment method.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'At least one product is required.';
  end if;
  if nullif(trim(p_customer->>'name'), '') is null
     or nullif(trim(p_customer->>'email'), '') is null
     or nullif(trim(p_customer->>'phone'), '') is null
     or nullif(trim(p_customer->>'address'), '') is null
     or v_city = ''
     or nullif(trim(p_customer->>'shippingMethodId'), '') is null
     or nullif(trim(p_customer->>'shippingZoneId'), '') is null then
    raise exception using errcode = '23514',
      message = 'Complete customer, delivery, and shipping method details are required.';
  end if;
  if p_customer_user_id is not null
     and not exists (
       select 1 from public.profiles
       where id = p_customer_user_id and role = 'customer'
     ) then
    raise exception using errcode = '23503', message = 'Customer account not found.';
  end if;

  v_currency := case when p_country = 'sri-lanka' then 'LKR' else 'AED' end;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity <= 0 or v_quantity > 1000 then
      raise exception using errcode = '23514', message = 'Invalid product quantity.';
    end if;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;
    if not found or v_product.status <> 'active' then
      raise exception using errcode = 'P0002', message = 'A product is unavailable';
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
    and country_code = case when p_country = 'sri-lanka' then 'LK' else 'AE' end
    and active and archived_at is null
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
    and active and archived_at is null
    and fee is not null
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
  v_free_threshold_met :=
    v_method.free_shipping_threshold is not null
    and v_subtotal >= v_method.free_shipping_threshold;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;
    select * into v_rate
    from public.shipping_product_rates
    where shipping_method_id = v_method.id
      and product_id = v_product.id
      and active and archived_at is null;
    v_rate_found := found;
    if p_country = 'sri-lanka' then
      v_product_shipping := v_product.shipping_fee_lkr;
      v_free := v_product.free_shipping_lkr;
      v_calculation := v_product.shipping_calculation_lkr;
    else
      v_product_shipping := v_product.shipping_fee_aed;
      v_free := v_product.free_shipping_aed;
      v_calculation := v_product.shipping_calculation_aed;
    end if;
    if v_free_threshold_met or v_free then
      v_line_shipping := 0;
    elsif v_product_shipping is not null then
      v_line_shipping := v_product_shipping
        * case when v_calculation = 'per_unit' then v_quantity else 1 end;
    elsif v_rate_found and v_rate.free_shipping then
      v_line_shipping := 0;
      v_free := true;
    elsif v_rate_found and v_rate.fee is not null then
      v_calculation := v_rate.calculation_type;
      v_product_shipping := v_rate.fee;
      v_line_shipping := v_rate.fee
        * case when v_rate.calculation_type = 'per_unit' then v_quantity else 1 end;
    elsif not v_method_fee_applied then
      v_calculation := 'per_line';
      v_product_shipping := v_method.fee;
      v_line_shipping := v_method.fee;
      v_method_fee_applied := true;
    else
      v_calculation := 'per_line';
      v_product_shipping := 0;
      v_line_shipping := 0;
    end if;
    v_shipping := v_shipping + v_line_shipping;
  end loop;

  v_order_id := gen_random_uuid();
  v_order_number := 'YARA-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS')
    || '-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 6));
  insert into public.orders(
    id, order_number, customer_user_id, customer_name, customer_email,
    customer_phone, shipping_address, shipping_city, shipping_postal_code,
    shipping_address_snapshot, country, currency, subtotal_amount, shipping_fee,
    shipping_currency, discount_amount, total_amount, payment_method,
    payment_status, order_status, terms_accepted_at, idempotency_key,
    shipping_zone_id, shipping_method_id, shipping_method_name,
    cod_available_snapshot
  ) values (
    v_order_id, v_order_number, p_customer_user_id,
    left(trim(p_customer->>'name'), 200),
    left(lower(trim(p_customer->>'email')), 320),
    left(trim(p_customer->>'phone'), 50),
    left(trim(p_customer->>'address'), 500),
    left(trim(p_customer->>'city'), 160),
    left(coalesce(trim(p_customer->>'postalCode'), ''), 40),
    p_customer, p_country, v_currency, v_subtotal, v_shipping, v_currency, 0,
    v_subtotal + v_shipping, p_payment_method, 'pending', 'pending', now(),
    p_idempotency_key, v_zone.id, v_method.id, v_method.name,
    v_zone.cod_available and v_method.cod_available
  );

  v_method_fee_applied := false;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;
    select * into v_rate
    from public.shipping_product_rates
    where shipping_method_id = v_method.id
      and product_id = v_product.id
      and active and archived_at is null;
    v_rate_found := found;
    if p_country = 'sri-lanka' then
      v_unit_price := v_product.price_lkr;
      v_product_shipping := v_product.shipping_fee_lkr;
      v_free := v_product.free_shipping_lkr;
      v_calculation := v_product.shipping_calculation_lkr;
    else
      v_unit_price := v_product.price_aed;
      v_product_shipping := v_product.shipping_fee_aed;
      v_free := v_product.free_shipping_aed;
      v_calculation := v_product.shipping_calculation_aed;
    end if;
    if v_free_threshold_met or v_free then
      v_line_shipping := 0;
      v_free := true;
    elsif v_product_shipping is not null then
      v_line_shipping := v_product_shipping
        * case when v_calculation = 'per_unit' then v_quantity else 1 end;
    elsif v_rate_found and v_rate.free_shipping then
      v_line_shipping := 0;
      v_free := true;
    elsif v_rate_found and v_rate.fee is not null then
      v_calculation := v_rate.calculation_type;
      v_product_shipping := v_rate.fee;
      v_line_shipping := v_rate.fee
        * case when v_rate.calculation_type = 'per_unit' then v_quantity else 1 end;
    elsif not v_method_fee_applied then
      v_calculation := 'per_line';
      v_product_shipping := v_method.fee;
      v_line_shipping := v_method.fee;
      v_method_fee_applied := true;
    else
      v_calculation := 'per_line';
      v_product_shipping := 0;
      v_line_shipping := 0;
    end if;
    insert into public.order_items(
      order_id, product_id, quantity, unit_price, subtotal, shipping_fee,
      shipping_calculation_type, free_shipping, product_shipping_fee
    ) values (
      v_order_id, v_product.id, v_quantity, v_unit_price,
      v_unit_price * v_quantity, v_line_shipping, v_calculation, v_free,
      coalesce(v_product_shipping, 0)
    );
    update public.products
    set stock_quantity = v_product.stock_quantity - v_quantity
    where id = v_product.id;
    insert into public.stock_movements(
      product_id, movement_type, quantity_change, previous_stock, new_stock,
      reference_id
    ) values (
      v_product.id, 'online_order', -v_quantity, v_product.stock_quantity,
      v_product.stock_quantity - v_quantity, v_order_id
    );
  end loop;
  return query
    select v_order_id, v_order_number, v_subtotal + v_shipping, v_currency, true;
end;
$$;

revoke all on function public.create_storefront_order(
  jsonb, text, text, jsonb, uuid, uuid
) from public, anon, authenticated;
revoke execute on function public.create_storefront_order(
  jsonb, text, text, jsonb, uuid, uuid
) from service_role;
