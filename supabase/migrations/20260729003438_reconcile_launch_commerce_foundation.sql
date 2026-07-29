-- Product shipping and atomic checkout foundation.
-- Existing products remain available for browsing, but checkout is blocked until
-- an explicit fee or free-delivery flag is configured for the selected market.

alter table public.products
  add column if not exists shipping_fee_lkr numeric(12,2),
  add column if not exists shipping_fee_aed numeric(12,2),
  add column if not exists free_shipping_lkr boolean not null default false,
  add column if not exists free_shipping_aed boolean not null default false,
  add column if not exists shipping_available_lkr boolean not null default true,
  add column if not exists shipping_available_aed boolean not null default true,
  add column if not exists shipping_calculation_lkr text not null default 'per_line',
  add column if not exists shipping_calculation_aed text not null default 'per_line';

alter table public.products drop constraint if exists products_shipping_fee_lkr_check;
alter table public.products add constraint products_shipping_fee_lkr_check
  check (shipping_fee_lkr is null or shipping_fee_lkr >= 0);
alter table public.products drop constraint if exists products_shipping_fee_aed_check;
alter table public.products add constraint products_shipping_fee_aed_check
  check (shipping_fee_aed is null or shipping_fee_aed >= 0);
alter table public.products drop constraint if exists products_shipping_calculation_lkr_check;
alter table public.products add constraint products_shipping_calculation_lkr_check
  check (shipping_calculation_lkr in ('per_line', 'per_unit'));
alter table public.products drop constraint if exists products_shipping_calculation_aed_check;
alter table public.products add constraint products_shipping_calculation_aed_check
  check (shipping_calculation_aed in ('per_line', 'per_unit'));
alter table public.products drop constraint if exists products_shipping_lkr_configuration_check;
alter table public.products add constraint products_shipping_lkr_configuration_check
  check (not free_shipping_lkr or shipping_available_lkr);
alter table public.products drop constraint if exists products_shipping_aed_configuration_check;
alter table public.products add constraint products_shipping_aed_configuration_check
  check (not free_shipping_aed or shipping_available_aed);

alter table public.order_items
  add column if not exists shipping_fee numeric(12,2) not null default 0,
  add column if not exists shipping_calculation_type text not null default 'per_line',
  add column if not exists free_shipping boolean not null default false,
  add column if not exists product_shipping_fee numeric(12,2) not null default 0;
alter table public.order_items drop constraint if exists order_items_shipping_fee_check;
alter table public.order_items add constraint order_items_shipping_fee_check check (shipping_fee >= 0);
alter table public.order_items drop constraint if exists order_items_product_shipping_fee_check;
alter table public.order_items add constraint order_items_product_shipping_fee_check check (product_shipping_fee >= 0);
alter table public.order_items drop constraint if exists order_items_shipping_calculation_type_check;
alter table public.order_items add constraint order_items_shipping_calculation_type_check
  check (shipping_calculation_type in ('per_line', 'per_unit'));

alter table public.orders
  add column if not exists shipping_address_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists shipping_currency text,
  add column if not exists delivery_estimate_snapshot text not null default '';
alter table public.orders drop constraint if exists orders_shipping_currency_check;
alter table public.orders add constraint orders_shipping_currency_check
  check (shipping_currency is null or shipping_currency in ('LKR', 'AED'));

-- Preserve the existing RPC signature while teaching the product save routine
-- to persist the new shipping controls supplied by the admin application.
create or replace function public.save_admin_product(
  p_product_id uuid,
  p_actor_id uuid,
  p_product jsonb,
  p_skin_concern_ids uuid[],
  p_target_stock integer
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_product_id uuid := coalesce(p_product_id, gen_random_uuid());
  v_previous_stock integer := 0;
  v_category_id uuid;
  v_skin_concern_ids uuid[];
  v_valid_concern_count integer;
  v_benefits text[] := '{}'::text[];
  v_price_lkr numeric;
  v_price_aed numeric;
  v_original_price_lkr numeric;
  v_original_price_aed numeric;
  v_shipping_fee_lkr numeric;
  v_shipping_fee_aed numeric;
  v_free_shipping_lkr boolean;
  v_free_shipping_aed boolean;
  v_shipping_available_lkr boolean;
  v_shipping_available_aed boolean;
  v_shipping_calculation_lkr text;
  v_shipping_calculation_aed text;
begin
  if not exists (select 1 from public.profiles where id = p_actor_id and role = 'admin') then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;
  if p_product is null or jsonb_typeof(p_product) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid product payload.';
  end if;
  if nullif(trim(p_product->>'name'), '') is null
     or nullif(trim(p_product->>'slug'), '') is null
     or nullif(trim(p_product->>'sku'), '') is null then
    raise exception using errcode = '23514', message = 'Product name, slug, and SKU are required.';
  end if;
  if p_target_stock is null or p_target_stock < 0 then
    raise exception using errcode = '23514', message = 'Stock cannot be negative.';
  end if;

  v_price_lkr := (p_product->>'price_lkr')::numeric;
  v_price_aed := (p_product->>'price_aed')::numeric;
  v_original_price_lkr := nullif(p_product->>'original_price_lkr', '')::numeric;
  v_original_price_aed := nullif(p_product->>'original_price_aed', '')::numeric;
  v_shipping_fee_lkr := nullif(p_product->>'shipping_fee_lkr', '')::numeric;
  v_shipping_fee_aed := nullif(p_product->>'shipping_fee_aed', '')::numeric;
  v_free_shipping_lkr := coalesce((p_product->>'free_shipping_lkr')::boolean, false);
  v_free_shipping_aed := coalesce((p_product->>'free_shipping_aed')::boolean, false);
  v_shipping_available_lkr := coalesce((p_product->>'shipping_available_lkr')::boolean, true);
  v_shipping_available_aed := coalesce((p_product->>'shipping_available_aed')::boolean, true);
  v_shipping_calculation_lkr := coalesce(p_product->>'shipping_calculation_lkr', 'per_line');
  v_shipping_calculation_aed := coalesce(p_product->>'shipping_calculation_aed', 'per_line');

  if v_original_price_lkr is not null and v_original_price_lkr < v_price_lkr then
    raise exception using errcode = '23514', message = 'Sri Lanka original price must be higher than the selling price.';
  end if;
  if v_original_price_aed is not null and v_original_price_aed < v_price_aed then
    raise exception using errcode = '23514', message = 'UAE original price must be higher than the selling price.';
  end if;
  if v_shipping_fee_lkr is not null and v_shipping_fee_lkr < 0
     or v_shipping_fee_aed is not null and v_shipping_fee_aed < 0 then
    raise exception using errcode = '23514', message = 'Shipping fees cannot be negative.';
  end if;
  if v_shipping_calculation_lkr not in ('per_line', 'per_unit')
     or v_shipping_calculation_aed not in ('per_line', 'per_unit') then
    raise exception using errcode = '23514', message = 'Invalid shipping calculation type.';
  end if;
  if v_free_shipping_lkr and not v_shipping_available_lkr
     or v_free_shipping_aed and not v_shipping_available_aed then
    raise exception using errcode = '23514', message = 'Free delivery requires shipping availability.';
  end if;

  v_category_id := nullif(p_product->>'category_id', '')::uuid;
  if v_category_id is not null and not exists (select 1 from public.categories where id = v_category_id) then
    raise exception using errcode = '23503', message = 'Selected category does not exist.';
  end if;
  select coalesce(array_agg(id order by id), '{}'::uuid[]) into v_skin_concern_ids
  from (select distinct unnest(coalesce(p_skin_concern_ids, '{}'::uuid[])) as id) selected;
  select count(*) into v_valid_concern_count from public.skin_concerns where id = any(v_skin_concern_ids);
  if v_valid_concern_count <> cardinality(v_skin_concern_ids) then
    raise exception using errcode = '23503', message = 'One or more selected skin concerns do not exist.';
  end if;
  if jsonb_typeof(p_product->'benefits') = 'array' then
    select coalesce(array_agg(value), '{}'::text[]) into v_benefits
    from jsonb_array_elements_text(p_product->'benefits') benefit(value);
  end if;

  if p_product_id is null then
    insert into public.products (
      id, name, slug, description, category_id, image_url, price_lkr, price_aed,
      original_price_lkr, original_price_aed, sku, barcode, stock_quantity,
      low_stock_alert, status, benefits, how_to_use, ingredients, caution,
      original_category, image_status, pdf_source_page, seo_title, seo_description,
      featured, shipping_fee_lkr, shipping_fee_aed, free_shipping_lkr,
      free_shipping_aed, shipping_available_lkr, shipping_available_aed,
      shipping_calculation_lkr, shipping_calculation_aed
    ) values (
      v_product_id, trim(p_product->>'name'), trim(p_product->>'slug'), coalesce(p_product->>'description', ''),
      v_category_id, nullif(p_product->>'image_url', ''), v_price_lkr, v_price_aed,
      v_original_price_lkr, v_original_price_aed, trim(p_product->>'sku'), nullif(p_product->>'barcode', ''),
      0, (p_product->>'low_stock_alert')::integer, p_product->>'status', v_benefits,
      coalesce(p_product->>'how_to_use', ''), coalesce(p_product->>'ingredients', ''),
      coalesce(p_product->>'caution', ''), coalesce(p_product->>'original_category', ''),
      coalesce(p_product->>'image_status', ''), coalesce(p_product->>'pdf_source_page', ''),
      coalesce(p_product->>'seo_title', ''), coalesce(p_product->>'seo_description', ''),
      coalesce((p_product->>'featured')::boolean, false), v_shipping_fee_lkr,
      v_shipping_fee_aed, v_free_shipping_lkr, v_free_shipping_aed,
      v_shipping_available_lkr, v_shipping_available_aed,
      v_shipping_calculation_lkr, v_shipping_calculation_aed
    );
  else
    select stock_quantity into v_previous_stock from public.products where id = p_product_id for update;
    if not found then raise exception using errcode = 'P0002', message = 'Product not found.'; end if;
    update public.products set
      name = trim(p_product->>'name'), slug = trim(p_product->>'slug'),
      description = coalesce(p_product->>'description', ''), category_id = v_category_id,
      image_url = nullif(p_product->>'image_url', ''), price_lkr = v_price_lkr,
      price_aed = v_price_aed, original_price_lkr = v_original_price_lkr,
      original_price_aed = v_original_price_aed, sku = trim(p_product->>'sku'),
      barcode = nullif(p_product->>'barcode', ''),
      low_stock_alert = (p_product->>'low_stock_alert')::integer, status = p_product->>'status',
      benefits = v_benefits, how_to_use = coalesce(p_product->>'how_to_use', ''),
      ingredients = coalesce(p_product->>'ingredients', ''), caution = coalesce(p_product->>'caution', ''),
      original_category = coalesce(p_product->>'original_category', ''),
      image_status = coalesce(p_product->>'image_status', ''),
      pdf_source_page = coalesce(p_product->>'pdf_source_page', ''),
      seo_title = coalesce(p_product->>'seo_title', ''),
      seo_description = coalesce(p_product->>'seo_description', ''),
      featured = coalesce((p_product->>'featured')::boolean, false),
      shipping_fee_lkr = v_shipping_fee_lkr, shipping_fee_aed = v_shipping_fee_aed,
      free_shipping_lkr = v_free_shipping_lkr, free_shipping_aed = v_free_shipping_aed,
      shipping_available_lkr = v_shipping_available_lkr,
      shipping_available_aed = v_shipping_available_aed,
      shipping_calculation_lkr = v_shipping_calculation_lkr,
      shipping_calculation_aed = v_shipping_calculation_aed
    where id = p_product_id;
  end if;

  delete from public.product_skin_concerns where product_id = v_product_id;
  insert into public.product_skin_concerns(product_id, skin_concern_id)
  select v_product_id, unnest(v_skin_concern_ids);
  if p_target_stock <> v_previous_stock then
    update public.products set stock_quantity = p_target_stock where id = v_product_id;
    insert into public.stock_movements(product_id, movement_type, quantity_change, previous_stock, new_stock, created_by)
    values (v_product_id, case when p_target_stock > v_previous_stock then 'restock' else 'manual_adjustment' end,
      p_target_stock - v_previous_stock, v_previous_stock, p_target_stock, p_actor_id);
  end if;
  return v_product_id;
end;
$$;

revoke all on function public.save_admin_product(uuid, uuid, jsonb, uuid[], integer) from public, anon, authenticated;
grant execute on function public.save_admin_product(uuid, uuid, jsonb, uuid[], integer) to service_role;

-- New signature makes the idempotency key and authenticated owner part of the
-- same transaction as stock reduction and shipping snapshots.
create or replace function public.create_storefront_order(
  p_customer jsonb,
  p_country text,
  p_payment_method text,
  p_items jsonb,
  p_idempotency_key uuid,
  p_customer_user_id uuid default null
)
returns table(order_id uuid, order_number text, total_amount numeric, currency text, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_currency text;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_unit_price numeric(12,2);
  v_product_shipping numeric(12,2);
  v_line_shipping numeric(12,2);
  v_quantity integer;
  v_calculation text;
  v_free boolean;
  v_available boolean;
  v_existing public.orders%rowtype;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'Idempotency key is required.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.country <> p_country
       or lower(v_existing.customer_email) <> lower(trim(p_customer->>'email')) then
      raise exception using errcode = '23505', message = 'Idempotency key is already in use.';
    end if;
    return query select v_existing.id, v_existing.order_number, v_existing.total_amount, v_existing.currency, false;
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
     or nullif(trim(p_customer->>'city'), '') is null then
    raise exception using errcode = '23514', message = 'Complete customer and delivery details are required.';
  end if;
  if p_customer_user_id is not null
     and not exists (select 1 from public.profiles where id = p_customer_user_id and role = 'customer') then
    raise exception using errcode = '23503', message = 'Customer account not found.';
  end if;

  v_currency := case when p_country = 'sri-lanka' then 'LKR' else 'AED' end;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity <= 0 or v_quantity > 1000 then
      raise exception using errcode = '23514', message = 'Invalid product quantity.';
    end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    if not found or v_product.status <> 'active' then
      raise exception using errcode = 'P0002', message = 'A product is unavailable';
    end if;
    if v_product.stock_quantity < v_quantity then
      raise exception using errcode = '23514', message = 'Insufficient stock for ' || v_product.name;
    end if;
    if p_country = 'sri-lanka' then
      v_unit_price := v_product.price_lkr;
      v_product_shipping := v_product.shipping_fee_lkr;
      v_free := v_product.free_shipping_lkr;
      v_available := v_product.shipping_available_lkr;
      v_calculation := v_product.shipping_calculation_lkr;
    else
      v_unit_price := v_product.price_aed;
      v_product_shipping := v_product.shipping_fee_aed;
      v_free := v_product.free_shipping_aed;
      v_available := v_product.shipping_available_aed;
      v_calculation := v_product.shipping_calculation_aed;
    end if;
    if not v_available then
      raise exception using errcode = '23514', message = v_product.name || ' is not available in your region.';
    end if;
    if not v_free and v_product_shipping is null then
      raise exception using errcode = '23514', message = 'A delivery rate is not configured for ' || v_product.name;
    end if;
    v_line_shipping := case when v_free then 0 when v_calculation = 'per_unit' then v_product_shipping * v_quantity else v_product_shipping end;
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
    v_shipping := v_shipping + v_line_shipping;
  end loop;

  v_order_id := gen_random_uuid();
  v_order_number := 'YARA-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS') || '-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 6));
  insert into public.orders(
    id, order_number, customer_user_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_postal_code, shipping_address_snapshot,
    country, currency, subtotal_amount, shipping_fee, shipping_currency, discount_amount,
    total_amount, payment_method, payment_status, order_status, terms_accepted_at, idempotency_key
  ) values (
    v_order_id, v_order_number, p_customer_user_id, left(trim(p_customer->>'name'), 200),
    left(lower(trim(p_customer->>'email')), 320), left(trim(p_customer->>'phone'), 50),
    left(trim(p_customer->>'address'), 500), left(trim(p_customer->>'city'), 160),
    left(coalesce(trim(p_customer->>'postalCode'), ''), 40), p_customer,
    p_country, v_currency, v_subtotal, v_shipping, v_currency, 0,
    v_subtotal + v_shipping, p_payment_method, 'pending', 'pending', now(), p_idempotency_key
  );

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    if p_country = 'sri-lanka' then
      v_unit_price := v_product.price_lkr; v_product_shipping := v_product.shipping_fee_lkr;
      v_free := v_product.free_shipping_lkr; v_calculation := v_product.shipping_calculation_lkr;
    else
      v_unit_price := v_product.price_aed; v_product_shipping := v_product.shipping_fee_aed;
      v_free := v_product.free_shipping_aed; v_calculation := v_product.shipping_calculation_aed;
    end if;
    v_line_shipping := case when v_free then 0 when v_calculation = 'per_unit' then v_product_shipping * v_quantity else v_product_shipping end;
    insert into public.order_items(order_id, product_id, quantity, unit_price, subtotal,
      shipping_fee, shipping_calculation_type, free_shipping, product_shipping_fee)
    values (v_order_id, v_product.id, v_quantity, v_unit_price, v_unit_price * v_quantity,
      v_line_shipping, v_calculation, v_free, coalesce(v_product_shipping, 0));
    update public.products set stock_quantity = v_product.stock_quantity - v_quantity where id = v_product.id;
    insert into public.stock_movements(product_id, movement_type, quantity_change, previous_stock, new_stock, reference_id)
    values (v_product.id, 'online_order', -v_quantity, v_product.stock_quantity, v_product.stock_quantity - v_quantity, v_order_id);
  end loop;
  return query select v_order_id, v_order_number, v_subtotal + v_shipping, v_currency, true;
end;
$$;

revoke all on function public.create_storefront_order(jsonb, text, text, jsonb, uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_storefront_order(jsonb, text, text, jsonb, uuid, uuid) to service_role;
