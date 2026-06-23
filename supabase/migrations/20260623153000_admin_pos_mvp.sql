create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('admin', 'staff', 'customer')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  price_lkr numeric(12,2) not null default 0 check (price_lkr >= 0),
  price_aed numeric(12,2) not null default 0 check (price_aed >= 0),
  sku text not null unique,
  barcode text unique,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_alert integer not null default 5 check (low_stock_alert >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  country text not null check (country in ('sri-lanka', 'uae')),
  currency text not null check (currency in ('LKR', 'AED')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_method text not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'pending' check (order_status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0)
);

create table public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique,
  cashier_id uuid not null references public.profiles(id),
  payment_method text not null check (payment_method in ('cash', 'card', 'bank_transfer')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  created_at timestamptz not null default now()
);

create table public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_type text not null check (movement_type in ('online_order', 'pos_sale', 'manual_adjustment', 'restock')),
  quantity_change integer not null check (quantity_change <> 0),
  previous_stock integer not null check (previous_stock >= 0),
  new_stock integer not null check (new_stock >= 0),
  reference_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
create index products_status_stock_idx on public.products(status, stock_quantity);
create index products_barcode_idx on public.products(barcode) where barcode is not null;
create index orders_created_at_idx on public.orders(created_at desc);
create index orders_customer_user_id_idx on public.orders(customer_user_id);
create index order_items_order_id_idx on public.order_items(order_id);
create index pos_sales_created_at_idx on public.pos_sales(created_at desc);
create index pos_sale_items_sale_id_idx on public.pos_sale_items(sale_id);
create index stock_movements_product_created_idx on public.stock_movements(product_id, created_at desc);

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'staff')
  );
$$;
revoke all on function private.is_staff() from public;
grant execute on function private.is_staff() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute procedure private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;
alter table public.stock_movements enable row level security;

create policy "Profiles visible to owner or staff" on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select private.is_staff()));

create policy "Active categories are public" on public.categories for select to anon, authenticated
using (status = 'active' or (select private.is_staff()));
create policy "Staff insert categories" on public.categories for insert to authenticated
with check ((select private.is_staff()));
create policy "Staff update categories" on public.categories for update to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete categories" on public.categories for delete to authenticated
using ((select private.is_staff()));

create policy "Active products are public" on public.products for select to anon, authenticated
using (status = 'active' or (select private.is_staff()));
create policy "Staff insert products" on public.products for insert to authenticated
with check ((select private.is_staff()));
create policy "Staff update products" on public.products for update to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete products" on public.products for delete to authenticated
using ((select private.is_staff()));

create policy "Staff view orders" on public.orders for select to authenticated
using ((select private.is_staff()) or customer_user_id = (select auth.uid()));
create policy "Staff insert orders" on public.orders for insert to authenticated
with check ((select private.is_staff()));
create policy "Staff update orders" on public.orders for update to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete orders" on public.orders for delete to authenticated
using ((select private.is_staff()));

create policy "Staff or order owner view order items" on public.order_items for select to authenticated
using ((select private.is_staff()) or exists (
  select 1 from public.orders where orders.id = order_items.order_id and orders.customer_user_id = (select auth.uid())
));
create policy "Staff insert order items" on public.order_items for insert to authenticated
with check ((select private.is_staff()));
create policy "Staff update order items" on public.order_items for update to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete order items" on public.order_items for delete to authenticated
using ((select private.is_staff()));

create policy "Staff manage POS sales" on public.pos_sales for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff manage POS sale items" on public.pos_sale_items for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff manage stock movements" on public.stock_movements for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.categories, public.products, public.orders, public.order_items, public.pos_sales, public.pos_sale_items, public.stock_movements to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Staff upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select private.is_staff()));
create policy "Staff update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select private.is_staff()))
with check (bucket_id = 'product-images' and (select private.is_staff()));
create policy "Staff delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select private.is_staff()));

create or replace function public.adjust_product_stock(
  p_product_id uuid,
  p_quantity_change integer,
  p_movement_type text default 'manual_adjustment'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous integer;
  v_new integer;
begin
  if not (select private.is_staff()) then raise exception 'Staff access required'; end if;
  if p_quantity_change = 0 then raise exception 'Quantity change cannot be zero'; end if;
  if p_movement_type not in ('manual_adjustment', 'restock') then raise exception 'Invalid movement type'; end if;

  select stock_quantity into v_previous from public.products where id = p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  v_new := v_previous + p_quantity_change;
  if v_new < 0 then raise exception 'Stock cannot be negative'; end if;

  update public.products set stock_quantity = v_new where id = p_product_id;
  insert into public.stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, created_by)
  values (p_product_id, p_movement_type, p_quantity_change, v_previous, v_new, (select auth.uid()));
  return v_new;
end;
$$;
revoke all on function public.adjust_product_stock(uuid, integer, text) from public, anon;
grant execute on function public.adjust_product_stock(uuid, integer, text) to authenticated;

create or replace function public.complete_pos_sale(
  p_payment_method text,
  p_discount numeric,
  p_items jsonb
)
returns table (sale_id uuid, sale_number text, total_amount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_sale_id uuid := gen_random_uuid();
  v_sale_number text := 'POS-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_subtotal numeric := 0;
  v_discount numeric := greatest(coalesce(p_discount, 0), 0);
  v_total numeric;
  v_quantity integer;
begin
  if not (select private.is_staff()) then raise exception 'Staff access required'; end if;
  if p_payment_method not in ('cash', 'card', 'bank_transfer') then raise exception 'Invalid payment method'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Sale must contain items'; end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity <= 0 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid and status = 'active' for update;
    if not found then raise exception 'Product is unavailable'; end if;
    if v_product.stock_quantity < v_quantity then raise exception 'Insufficient stock for %', v_product.name; end if;
    v_subtotal := v_subtotal + (v_product.price_lkr * v_quantity);
  end loop;

  v_total := greatest(v_subtotal - v_discount, 0);
  if v_discount > v_subtotal then raise exception 'Discount cannot exceed subtotal'; end if;
  insert into public.pos_sales (id, sale_number, cashier_id, payment_method, subtotal, discount, total_amount)
  values (v_sale_id, v_sale_number, (select auth.uid()), p_payment_method, v_subtotal, v_discount, v_total);

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid for update;
    insert into public.pos_sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    values (v_sale_id, v_product.id, v_quantity, v_product.price_lkr, v_product.price_lkr * v_quantity);
    update public.products set stock_quantity = v_product.stock_quantity - v_quantity where id = v_product.id;
    insert into public.stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, reference_id, created_by)
    values (v_product.id, 'pos_sale', -v_quantity, v_product.stock_quantity, v_product.stock_quantity - v_quantity, v_sale_id, (select auth.uid()));
  end loop;

  return query select v_sale_id, v_sale_number, v_total;
end;
$$;
revoke all on function public.complete_pos_sale(text, numeric, jsonb) from public, anon;
grant execute on function public.complete_pos_sale(text, numeric, jsonb) to authenticated;
