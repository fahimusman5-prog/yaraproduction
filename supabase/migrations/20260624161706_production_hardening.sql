alter table public.orders
  add column if not exists shipping_address text not null default '',
  add column if not exists shipping_city text not null default '',
  add column if not exists shipping_postal_code text not null default '',
  add column if not exists payment_provider text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_status_code integer,
  add column if not exists payment_updated_at timestamptz,
  add column if not exists stock_released_at timestamptz;

alter table public.pos_sales
  add column if not exists currency text not null default 'LKR'
  check (currency in ('LKR', 'AED'));

create unique index if not exists order_items_order_product_idx
  on public.order_items(order_id, product_id);
create unique index if not exists pos_sale_items_sale_product_idx
  on public.pos_sale_items(sale_id, product_id);
create index if not exists orders_payment_provider_idx
  on public.orders(payment_provider, payment_status, created_at desc);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "Staff insert categories" on public.categories;
drop policy if exists "Staff update categories" on public.categories;
drop policy if exists "Staff delete categories" on public.categories;
drop policy if exists "Staff insert products" on public.products;
drop policy if exists "Staff update products" on public.products;
drop policy if exists "Staff delete products" on public.products;

create policy "Admin insert categories" on public.categories for insert to authenticated
with check ((select private.is_admin()));
create policy "Admin update categories" on public.categories for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin delete categories" on public.categories for delete to authenticated
using ((select private.is_admin()));
create policy "Admin insert products" on public.products for insert to authenticated
with check ((select private.is_admin()));
create policy "Admin update products" on public.products for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin delete products" on public.products for delete to authenticated
using ((select private.is_admin()));

create or replace function public.create_storefront_order(
  p_customer jsonb,
  p_country text,
  p_payment_method text,
  p_items jsonb
)
returns table (order_id uuid, order_number text, total_amount numeric, currency text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text := 'YARA-' || to_char(clock_timestamp() at time zone 'UTC', 'YYYYMMDDHH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_currency text;
  v_total numeric(12,2) := 0;
  v_line record;
  v_product public.products%rowtype;
  v_price numeric(12,2);
begin
  if p_country not in ('sri-lanka', 'uae') then raise exception 'Invalid country'; end if;
  if p_payment_method not in ('payhere', 'cod') then raise exception 'Invalid payment method'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 100 then
    raise exception 'Order must contain between 1 and 100 items';
  end if;
  if nullif(trim(p_customer->>'name'), '') is null
     or nullif(trim(p_customer->>'email'), '') is null
     or nullif(trim(p_customer->>'phone'), '') is null
     or nullif(trim(p_customer->>'address'), '') is null
     or nullif(trim(p_customer->>'city'), '') is null then
    raise exception 'Customer details are incomplete';
  end if;

  v_currency := case when p_country = 'sri-lanka' then 'LKR' else 'AED' end;

  for v_line in
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by product_id
    order by product_id
  loop
    if v_line.quantity < 1 or v_line.quantity > 1000 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products
      where id = v_line.product_id and status = 'active' for update;
    if not found then raise exception 'A product is unavailable'; end if;
    if v_product.stock_quantity < v_line.quantity then raise exception 'Insufficient stock for %', v_product.name; end if;
    v_price := case when v_currency = 'LKR' then v_product.price_lkr else v_product.price_aed end;
    v_total := v_total + (v_price * v_line.quantity);
  end loop;

  insert into public.orders (
    id, order_number, customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_postal_code, country, currency,
    total_amount, payment_method, payment_provider, payment_status, order_status
  ) values (
    v_order_id, v_order_number, left(trim(p_customer->>'name'), 200), lower(left(trim(p_customer->>'email'), 320)),
    left(trim(p_customer->>'phone'), 50), left(trim(p_customer->>'address'), 500), left(trim(p_customer->>'city'), 160),
    left(trim(coalesce(p_customer->>'postalCode', '')), 40), p_country, v_currency, v_total, p_payment_method,
    case when p_payment_method = 'payhere' then 'payhere' end, 'pending',
    case when p_payment_method = 'cod' then 'processing' else 'pending' end
  );

  for v_line in
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by product_id
    order by product_id
  loop
    select * into v_product from public.products where id = v_line.product_id for update;
    v_price := case when v_currency = 'LKR' then v_product.price_lkr else v_product.price_aed end;
    insert into public.order_items(order_id, product_id, quantity, unit_price, subtotal)
      values (v_order_id, v_product.id, v_line.quantity, v_price, v_price * v_line.quantity);
    update public.products set stock_quantity = v_product.stock_quantity - v_line.quantity where id = v_product.id;
    insert into public.stock_movements(product_id, movement_type, quantity_change, previous_stock, new_stock, reference_id)
      values (v_product.id, 'online_order', -v_line.quantity, v_product.stock_quantity, v_product.stock_quantity - v_line.quantity, v_order_id);
  end loop;

  return query select v_order_id, v_order_number, v_total, v_currency;
end;
$$;
revoke all on function public.create_storefront_order(jsonb, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_storefront_order(jsonb, text, text, jsonb) to service_role;

create or replace function public.update_payhere_payment(
  p_order_number text,
  p_provider_payment_id text,
  p_status_code integer,
  p_amount numeric,
  p_currency text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_product public.products%rowtype;
begin
  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found or v_order.payment_provider <> 'payhere' then raise exception 'Order not found'; end if;
  if v_order.total_amount <> p_amount or v_order.currency <> p_currency then raise exception 'Payment amount mismatch'; end if;
  if v_order.payment_status = 'paid' and p_status_code <> 2 then return; end if;

  update public.orders set
    provider_payment_id = nullif(p_provider_payment_id, ''),
    provider_status_code = p_status_code,
    payment_updated_at = now(),
    payment_status = case p_status_code when 2 then 'paid' when 0 then 'pending' when -3 then 'refunded' else 'failed' end,
    order_status = case p_status_code when 2 then 'paid' when 0 then order_status else 'cancelled' end
  where id = v_order.id;

  if p_status_code in (-1, -2) and v_order.stock_released_at is null then
    for v_item in select product_id, quantity from public.order_items where order_id = v_order.id order by product_id
    loop
      select * into v_product from public.products where id = v_item.product_id for update;
      update public.products set stock_quantity = v_product.stock_quantity + v_item.quantity where id = v_product.id;
      insert into public.stock_movements(product_id, movement_type, quantity_change, previous_stock, new_stock, reference_id)
        values (v_product.id, 'manual_adjustment', v_item.quantity, v_product.stock_quantity, v_product.stock_quantity + v_item.quantity, v_order.id);
    end loop;
    update public.orders set stock_released_at = now() where id = v_order.id;
  end if;
end;
$$;
revoke all on function public.update_payhere_payment(text, text, integer, numeric, text) from public, anon, authenticated;
grant execute on function public.update_payhere_payment(text, text, integer, numeric, text) to service_role;

create or replace function public.complete_pos_sale(
  p_payment_method text,
  p_discount numeric,
  p_items jsonb,
  p_currency text
)
returns table (sale_id uuid, sale_number text, total_amount numeric, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_sale_id uuid := gen_random_uuid();
  v_sale_number text := 'POS-' || to_char(clock_timestamp() at time zone 'UTC', 'YYYYMMDDHH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_subtotal numeric := 0;
  v_discount numeric := greatest(coalesce(p_discount, 0), 0);
  v_total numeric;
  v_quantity integer;
  v_price numeric;
  v_created_at timestamptz := now();
begin
  if not (select private.is_staff()) then raise exception 'Staff access required'; end if;
  if p_payment_method not in ('cash', 'card', 'bank_transfer') then raise exception 'Invalid payment method'; end if;
  if p_currency not in ('LKR', 'AED') then raise exception 'Invalid currency'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Sale must contain items'; end if;

  for v_item in select value from jsonb_array_elements(p_items) order by value->>'product_id'
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity <= 0 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid and status = 'active' for update;
    if not found then raise exception 'Product is unavailable'; end if;
    if v_product.stock_quantity < v_quantity then raise exception 'Insufficient stock for %', v_product.name; end if;
    v_price := case when p_currency = 'LKR' then v_product.price_lkr else v_product.price_aed end;
    v_subtotal := v_subtotal + (v_price * v_quantity);
  end loop;

  if v_discount > v_subtotal then raise exception 'Discount cannot exceed subtotal'; end if;
  v_total := v_subtotal - v_discount;
  insert into public.pos_sales (id, sale_number, cashier_id, payment_method, subtotal, discount, total_amount, currency, created_at)
  values (v_sale_id, v_sale_number, (select auth.uid()), p_payment_method, v_subtotal, v_discount, v_total, p_currency, v_created_at);

  for v_item in select value from jsonb_array_elements(p_items) order by value->>'product_id'
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid for update;
    v_price := case when p_currency = 'LKR' then v_product.price_lkr else v_product.price_aed end;
    insert into public.pos_sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    values (v_sale_id, v_product.id, v_quantity, v_price, v_price * v_quantity);
    update public.products set stock_quantity = v_product.stock_quantity - v_quantity where id = v_product.id;
    insert into public.stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, reference_id, created_by)
    values (v_product.id, 'pos_sale', -v_quantity, v_product.stock_quantity, v_product.stock_quantity - v_quantity, v_sale_id, (select auth.uid()));
  end loop;

  return query select v_sale_id, v_sale_number, v_total, v_created_at;
end;
$$;
revoke all on function public.complete_pos_sale(text, numeric, jsonb, text) from public, anon;
grant execute on function public.complete_pos_sale(text, numeric, jsonb, text) to authenticated;
