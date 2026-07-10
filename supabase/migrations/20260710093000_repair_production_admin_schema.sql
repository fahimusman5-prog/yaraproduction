create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  role text not null default 'customer' check (role in ('admin', 'staff', 'customer')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories add column if not exists updated_at timestamptz not null default now();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  category_id uuid,
  image_url text,
  price_lkr numeric(12,2) not null default 0 check (price_lkr >= 0),
  price_aed numeric(12,2) not null default 0 check (price_aed >= 0),
  sku text not null default '',
  barcode text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_alert integer not null default 5 check (low_stock_alert >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  benefits text[] not null default '{}'::text[],
  how_to_use text not null default '',
  ingredients text not null default '',
  caution text not null default '',
  original_category text not null default '',
  image_status text not null default '',
  pdf_source_page text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists category_id uuid;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists price_lkr numeric(12,2) not null default 0;
alter table public.products add column if not exists price_aed numeric(12,2) not null default 0;
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists stock_quantity integer not null default 0;
alter table public.products add column if not exists low_stock_alert integer not null default 5;
alter table public.products add column if not exists status text not null default 'active';
alter table public.products add column if not exists benefits text[] not null default '{}'::text[];
alter table public.products add column if not exists how_to_use text not null default '';
alter table public.products add column if not exists ingredients text not null default '';
alter table public.products add column if not exists caution text not null default '';
alter table public.products add column if not exists original_category text not null default '';
alter table public.products add column if not exists image_status text not null default '';
alter table public.products add column if not exists pdf_source_page text not null default '';
alter table public.products add column if not exists seo_title text not null default '';
alter table public.products add column if not exists seo_description text not null default '';
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

update public.products
set
  slug = coalesce(nullif(slug, ''), lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))),
  sku = coalesce(nullif(sku, ''), 'YARA-' || upper(substr(replace(id::text, '-', ''), 1, 12))),
  description = coalesce(description, ''),
  status = coalesce(status, 'active'),
  benefits = coalesce(benefits, '{}'::text[]),
  how_to_use = coalesce(how_to_use, ''),
  ingredients = coalesce(ingredients, ''),
  caution = coalesce(caution, ''),
  original_category = coalesce(original_category, ''),
  image_status = coalesce(image_status, ''),
  pdf_source_page = coalesce(pdf_source_page, ''),
  seo_title = coalesce(seo_title, ''),
  seo_description = coalesce(seo_description, ''),
  featured = coalesce(featured, false)
where slug is null
   or sku is null
   or description is null
   or status is null
   or benefits is null
   or how_to_use is null
   or ingredients is null
   or caution is null
   or original_category is null
   or image_status is null
   or pdf_source_page is null
   or seo_title is null
   or seo_description is null
   or featured is null;

alter table public.products alter column slug set not null;
alter table public.products alter column sku set not null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  customer_user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  shipping_address text not null default '',
  shipping_city text not null default '',
  shipping_postal_code text not null default '',
  country text not null check (country in ('sri-lanka', 'uae')),
  currency text not null check (currency in ('LKR', 'AED')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_method text not null,
  payment_provider text,
  provider_payment_id text,
  provider_status_code integer,
  payment_updated_at timestamptz,
  stock_released_at timestamptz,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'pending' check (order_status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists shipping_address text not null default '';
alter table public.orders add column if not exists shipping_city text not null default '';
alter table public.orders add column if not exists shipping_postal_code text not null default '';
alter table public.orders add column if not exists payment_provider text;
alter table public.orders add column if not exists provider_payment_id text;
alter table public.orders add column if not exists provider_status_code integer;
alter table public.orders add column if not exists payment_updated_at timestamptz;
alter table public.orders add column if not exists stock_released_at timestamptz;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0)
);

create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null,
  cashier_id uuid references public.profiles(id),
  payment_method text not null check (payment_method in ('cash', 'card', 'bank_transfer')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  currency text not null default 'LKR' check (currency in ('LKR', 'AED')),
  created_at timestamptz not null default now()
);

alter table public.pos_sales add column if not exists currency text not null default 'LKR';

create table if not exists public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0)
);

create table if not exists public.stock_movements (
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

create table if not exists public.skin_concerns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

alter table public.skin_concerns add column if not exists status text;
alter table public.skin_concerns add column if not exists created_at timestamptz not null default now();
alter table public.skin_concerns add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'skin_concerns' and column_name = 'is_active'
  ) then
    update public.skin_concerns
    set status = case when is_active then 'active' else 'inactive' end
    where status is null;
  else
    update public.skin_concerns set status = 'active' where status is null;
  end if;
end $$;

alter table public.skin_concerns alter column status set default 'active';
alter table public.skin_concerns alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skin_concerns_status_check'
      and conrelid = 'public.skin_concerns'::regclass
  ) then
    alter table public.skin_concerns
      add constraint skin_concerns_status_check
      check (status in ('active', 'inactive')) not valid;
  end if;
end $$;
alter table public.skin_concerns validate constraint skin_concerns_status_check;

create table if not exists public.product_skin_concerns (
  product_id uuid not null references public.products(id) on delete cascade,
  skin_concern_id uuid not null references public.skin_concerns(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, skin_concern_id)
);

alter table public.product_skin_concerns add column if not exists created_at timestamptz not null default now();

delete from public.product_skin_concerns psc
where not exists (select 1 from public.products p where p.id = psc.product_id)
   or not exists (select 1 from public.skin_concerns sc where sc.id = psc.skin_concern_id);

delete from public.product_skin_concerns a
using public.product_skin_concerns b
where a.ctid < b.ctid
  and a.product_id = b.product_id
  and a.skin_concern_id = b.skin_concern_id;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'product_skin_concerns_pkey' and conrelid = 'public.product_skin_concerns'::regclass) then
    alter table public.product_skin_concerns
      add constraint product_skin_concerns_pkey primary key (product_id, skin_concern_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_skin_concerns_product_id_fkey' and conrelid = 'public.product_skin_concerns'::regclass) then
    alter table public.product_skin_concerns
      add constraint product_skin_concerns_product_id_fkey
      foreign key (product_id) references public.products(id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_skin_concerns_skin_concern_id_fkey' and conrelid = 'public.product_skin_concerns'::regclass) then
    alter table public.product_skin_concerns
      add constraint product_skin_concerns_skin_concern_id_fkey
      foreign key (skin_concern_id) references public.skin_concerns(id) on delete cascade not valid;
  end if;
end $$;

alter table public.product_skin_concerns validate constraint product_skin_concerns_product_id_fkey;
alter table public.product_skin_concerns validate constraint product_skin_concerns_skin_concern_id_fkey;

do $$
begin
  update public.products p
  set category_id = null
  where category_id is not null
    and not exists (select 1 from public.categories c where c.id = p.category_id);

  if exists (
    select 1 from pg_constraint
    where conname = 'products_category_id_fkey'
      and conrelid = 'public.products'::regclass
      and confdeltype <> 'r'
  ) then
    alter table public.products drop constraint products_category_id_fkey;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_category_id_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_category_id_fkey
      foreign key (category_id) references public.categories(id) on delete restrict not valid;
  end if;
end $$;
alter table public.products validate constraint products_category_id_fkey;

with ranked as (
  select id, slug, row_number() over (partition by slug order by created_at, id) as row_number
  from public.products
)
update public.products p
set slug = ranked.slug || '-' || substr(replace(p.id::text, '-', ''), 1, 8)
from ranked
where p.id = ranked.id and ranked.row_number > 1;

with ranked as (
  select id, sku, row_number() over (partition by sku order by created_at, id) as row_number
  from public.products
)
update public.products p
set sku = ranked.sku || '-' || upper(substr(replace(p.id::text, '-', ''), 1, 8))
from ranked
where p.id = ranked.id and ranked.row_number > 1;

create unique index if not exists categories_slug_key on public.categories(slug);
create unique index if not exists categories_name_key on public.categories(name);
create unique index if not exists skin_concerns_slug_key on public.skin_concerns(slug);
create unique index if not exists skin_concerns_name_key on public.skin_concerns(name);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_status_stock_idx on public.products(status, stock_quantity);
create unique index if not exists products_slug_key on public.products(slug);
create unique index if not exists products_sku_key on public.products(sku);
create unique index if not exists products_barcode_key on public.products(barcode) where barcode is not null;
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_customer_user_id_idx on public.orders(customer_user_id);
create index if not exists orders_payment_provider_idx on public.orders(payment_provider, payment_status, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists pos_sales_created_at_idx on public.pos_sales(created_at desc);
create index if not exists pos_sale_items_sale_id_idx on public.pos_sale_items(sale_id);
create index if not exists stock_movements_product_created_idx on public.stock_movements(product_id, created_at desc);
create index if not exists product_skin_concerns_concern_idx on public.product_skin_concerns(skin_concern_id);

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
revoke all on function private.is_staff() from public, anon, service_role;
grant execute on function private.is_staff() to authenticated;

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
revoke all on function private.is_admin() from public, anon, service_role;
grant execute on function private.is_admin() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
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

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute procedure private.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute procedure private.set_updated_at();

drop trigger if exists skin_concerns_set_updated_at on public.skin_concerns;
create trigger skin_concerns_set_updated_at
before update on public.skin_concerns
for each row execute procedure private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.skin_concerns enable row level security;
alter table public.product_skin_concerns enable row level security;

drop policy if exists "Profiles visible to owner or staff" on public.profiles;
create policy "Profiles visible to owner or staff" on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select private.is_staff()));

drop policy if exists "Active categories are public" on public.categories;
drop policy if exists "Public view active categories" on public.categories;
drop policy if exists "Staff view all categories" on public.categories;
drop policy if exists "Anonymous view active categories" on public.categories;
drop policy if exists "Authenticated view allowed categories" on public.categories;
create policy "Public view active categories" on public.categories for select to anon
using (status = 'active');
create policy "Staff view all categories" on public.categories for select to authenticated
using (status = 'active' or (select private.is_staff()));
drop policy if exists "Staff insert categories" on public.categories;
drop policy if exists "Staff update categories" on public.categories;
drop policy if exists "Staff delete categories" on public.categories;
drop policy if exists "Admin insert categories" on public.categories;
drop policy if exists "Admin update categories" on public.categories;
drop policy if exists "Admin delete categories" on public.categories;
create policy "Admin insert categories" on public.categories for insert to authenticated with check ((select private.is_admin()));
create policy "Admin update categories" on public.categories for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin delete categories" on public.categories for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Active products are public" on public.products;
drop policy if exists "Public view active products" on public.products;
drop policy if exists "Staff view all products" on public.products;
drop policy if exists "Anonymous view active products" on public.products;
drop policy if exists "Authenticated view allowed products" on public.products;
create policy "Public view active products" on public.products for select to anon
using (status = 'active');
create policy "Staff view all products" on public.products for select to authenticated
using (status = 'active' or (select private.is_staff()));
drop policy if exists "Staff insert products" on public.products;
drop policy if exists "Staff update products" on public.products;
drop policy if exists "Staff delete products" on public.products;
drop policy if exists "Admin insert products" on public.products;
drop policy if exists "Admin update products" on public.products;
drop policy if exists "Admin delete products" on public.products;
create policy "Admin insert products" on public.products for insert to authenticated with check ((select private.is_admin()));
create policy "Admin update products" on public.products for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin delete products" on public.products for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Staff view orders" on public.orders;
create policy "Staff view orders" on public.orders for select to authenticated
using ((select private.is_staff()) or customer_user_id = (select auth.uid()));
drop policy if exists "Staff insert orders" on public.orders;
create policy "Staff insert orders" on public.orders for insert to authenticated with check ((select private.is_staff()));
drop policy if exists "Staff update orders" on public.orders;
create policy "Staff update orders" on public.orders for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Staff delete orders" on public.orders;
create policy "Staff delete orders" on public.orders for delete to authenticated using ((select private.is_staff()));

drop policy if exists "Staff or order owner view order items" on public.order_items;
create policy "Staff or order owner view order items" on public.order_items for select to authenticated
using ((select private.is_staff()) or exists (
  select 1 from public.orders where orders.id = order_items.order_id and orders.customer_user_id = (select auth.uid())
));
drop policy if exists "Staff insert order items" on public.order_items;
create policy "Staff insert order items" on public.order_items for insert to authenticated with check ((select private.is_staff()));
drop policy if exists "Staff update order items" on public.order_items;
create policy "Staff update order items" on public.order_items for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Staff delete order items" on public.order_items;
create policy "Staff delete order items" on public.order_items for delete to authenticated using ((select private.is_staff()));

drop policy if exists "Staff manage POS sales" on public.pos_sales;
create policy "Staff manage POS sales" on public.pos_sales for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Staff manage POS sale items" on public.pos_sale_items;
create policy "Staff manage POS sale items" on public.pos_sale_items for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Staff manage stock movements" on public.stock_movements;
create policy "Staff manage stock movements" on public.stock_movements for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

drop policy if exists "Active skin concerns are public" on public.skin_concerns;
drop policy if exists "Public can view active skin concerns" on public.skin_concerns;
drop policy if exists "Public view active skin concerns" on public.skin_concerns;
drop policy if exists "Admins can manage skin concerns" on public.skin_concerns;
drop policy if exists "Staff view all skin concerns" on public.skin_concerns;
create policy "Public view active skin concerns" on public.skin_concerns for select to anon using (status = 'active');
create policy "Staff view all skin concerns" on public.skin_concerns for select to authenticated using (status = 'active' or (select private.is_staff()));
drop policy if exists "Staff insert skin concerns" on public.skin_concerns;
create policy "Staff insert skin concerns" on public.skin_concerns for insert to authenticated with check ((select private.is_staff()));
drop policy if exists "Staff update skin concerns" on public.skin_concerns;
create policy "Staff update skin concerns" on public.skin_concerns for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Staff delete skin concerns" on public.skin_concerns;
create policy "Staff delete skin concerns" on public.skin_concerns for delete to authenticated using ((select private.is_staff()));
drop policy if exists "Product skin concerns are public" on public.product_skin_concerns;
drop policy if exists "Public can view product skin concerns" on public.product_skin_concerns;
drop policy if exists "Admins can manage product skin concerns" on public.product_skin_concerns;
drop policy if exists "Public view active product skin concerns" on public.product_skin_concerns;
drop policy if exists "Staff view product skin concerns" on public.product_skin_concerns;
create policy "Public view active product skin concerns" on public.product_skin_concerns for select to anon using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  and exists (select 1 from public.skin_concerns sc where sc.id = skin_concern_id and sc.status = 'active')
);
create policy "Staff view product skin concerns" on public.product_skin_concerns for select to authenticated using (
  (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    and exists (select 1 from public.skin_concerns sc where sc.id = skin_concern_id and sc.status = 'active')
  )
  or (select private.is_staff())
);
drop policy if exists "Staff manage product skin concerns" on public.product_skin_concerns;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.products, public.skin_concerns, public.product_skin_concerns to anon, authenticated;
grant select on public.profiles, public.orders, public.order_items, public.pos_sales, public.pos_sale_items, public.stock_movements to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.categories, public.products, public.skin_concerns, public.product_skin_concerns, public.orders, public.order_items, public.pos_sales, public.pos_sale_items, public.stock_movements, public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on public.categories, public.products, public.skin_concerns, public.product_skin_concerns from authenticated;
grant select, insert, update, delete on public.categories, public.products, public.orders, public.order_items, public.pos_sales, public.pos_sale_items, public.stock_movements, public.skin_concerns, public.product_skin_concerns, public.profiles to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Staff upload product images" on storage.objects;
drop policy if exists "Staff update product images" on storage.objects;
drop policy if exists "Staff delete product images" on storage.objects;
create policy "Public read product images" on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');
create policy "Staff upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select private.is_staff()));
create policy "Staff update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select private.is_staff()))
with check (bucket_id = 'product-images' and (select private.is_staff()));
create policy "Staff delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select private.is_staff()));

drop function if exists public.adjust_product_stock(uuid, integer, text);

create or replace function public.adjust_admin_product_stock(
  p_product_id uuid,
  p_quantity_change integer,
  p_movement_type text,
  p_actor_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_previous integer;
  v_new integer;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role in ('admin', 'staff')
  ) then
    raise exception using errcode = '42501', message = 'Staff access required.';
  end if;
  if p_quantity_change = 0 then raise exception 'Quantity change cannot be zero'; end if;
  if p_movement_type not in ('manual_adjustment', 'restock') then raise exception 'Invalid movement type'; end if;

  select stock_quantity into v_previous from public.products where id = p_product_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Product not found.'; end if;
  v_new := v_previous + p_quantity_change;
  if v_new < 0 then raise exception 'Stock cannot be negative'; end if;

  update public.products set stock_quantity = v_new where id = p_product_id;
  insert into public.stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, created_by)
  values (p_product_id, p_movement_type, p_quantity_change, v_previous, v_new, p_actor_id);
  return v_new;
end;
$$;
revoke all on function public.adjust_admin_product_stock(uuid, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.adjust_admin_product_stock(uuid, integer, text, uuid) to service_role;

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
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role = 'admin'
  ) then
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

  v_category_id := nullif(p_product->>'category_id', '')::uuid;
  if v_category_id is not null and not exists (
    select 1 from public.categories where id = v_category_id
  ) then
    raise exception using errcode = '23503', message = 'Selected category does not exist.';
  end if;

  select coalesce(array_agg(id order by id), '{}'::uuid[])
  into v_skin_concern_ids
  from (
    select distinct unnest(coalesce(p_skin_concern_ids, '{}'::uuid[])) as id
  ) selected;

  select count(*) into v_valid_concern_count
  from public.skin_concerns
  where id = any(v_skin_concern_ids);
  if v_valid_concern_count <> cardinality(v_skin_concern_ids) then
    raise exception using errcode = '23503', message = 'One or more selected skin concerns do not exist.';
  end if;

  if jsonb_typeof(p_product->'benefits') = 'array' then
    select coalesce(array_agg(value), '{}'::text[])
    into v_benefits
    from jsonb_array_elements_text(p_product->'benefits') benefit(value);
  end if;

  if p_product_id is null then
    insert into public.products (
      id, name, slug, description, category_id, image_url, price_lkr, price_aed,
      sku, barcode, stock_quantity, low_stock_alert, status, benefits, how_to_use,
      ingredients, caution, original_category, image_status, pdf_source_page,
      seo_title, seo_description, featured
    ) values (
      v_product_id, trim(p_product->>'name'), trim(p_product->>'slug'), coalesce(p_product->>'description', ''),
      v_category_id, nullif(p_product->>'image_url', ''), (p_product->>'price_lkr')::numeric,
      (p_product->>'price_aed')::numeric, trim(p_product->>'sku'), nullif(p_product->>'barcode', ''),
      0, (p_product->>'low_stock_alert')::integer, p_product->>'status', v_benefits,
      coalesce(p_product->>'how_to_use', ''), coalesce(p_product->>'ingredients', ''),
      coalesce(p_product->>'caution', ''), coalesce(p_product->>'original_category', ''),
      coalesce(p_product->>'image_status', ''), coalesce(p_product->>'pdf_source_page', ''),
      coalesce(p_product->>'seo_title', ''), coalesce(p_product->>'seo_description', ''),
      coalesce((p_product->>'featured')::boolean, false)
    );
  else
    select stock_quantity into v_previous_stock
    from public.products
    where id = p_product_id
    for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'Product not found.';
    end if;

    update public.products set
      name = trim(p_product->>'name'),
      slug = trim(p_product->>'slug'),
      description = coalesce(p_product->>'description', ''),
      category_id = v_category_id,
      image_url = nullif(p_product->>'image_url', ''),
      price_lkr = (p_product->>'price_lkr')::numeric,
      price_aed = (p_product->>'price_aed')::numeric,
      sku = trim(p_product->>'sku'),
      barcode = nullif(p_product->>'barcode', ''),
      low_stock_alert = (p_product->>'low_stock_alert')::integer,
      status = p_product->>'status',
      benefits = v_benefits,
      how_to_use = coalesce(p_product->>'how_to_use', ''),
      ingredients = coalesce(p_product->>'ingredients', ''),
      caution = coalesce(p_product->>'caution', ''),
      original_category = coalesce(p_product->>'original_category', ''),
      image_status = coalesce(p_product->>'image_status', ''),
      pdf_source_page = coalesce(p_product->>'pdf_source_page', ''),
      seo_title = coalesce(p_product->>'seo_title', ''),
      seo_description = coalesce(p_product->>'seo_description', ''),
      featured = coalesce((p_product->>'featured')::boolean, false)
    where id = p_product_id;
  end if;

  delete from public.product_skin_concerns where product_id = v_product_id;
  insert into public.product_skin_concerns (product_id, skin_concern_id)
  select v_product_id, unnest(v_skin_concern_ids);

  if p_target_stock <> v_previous_stock then
    update public.products set stock_quantity = p_target_stock where id = v_product_id;
    insert into public.stock_movements (
      product_id, movement_type, quantity_change, previous_stock, new_stock, created_by
    ) values (
      v_product_id,
      case when p_target_stock > v_previous_stock then 'restock' else 'manual_adjustment' end,
      p_target_stock - v_previous_stock,
      v_previous_stock,
      p_target_stock,
      p_actor_id
    );
  end if;

  return v_product_id;
end;
$$;
revoke all on function public.save_admin_product(uuid, uuid, jsonb, uuid[], integer) from public, anon, authenticated;
grant execute on function public.save_admin_product(uuid, uuid, jsonb, uuid[], integer) to service_role;

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
    select * into v_product from public.products where id = v_line.product_id and status = 'active' for update;
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

insert into public.categories(name, slug, status) values
  ('Skincare', 'skincare', 'active'),
  ('Haircare', 'haircare', 'active'),
  ('Body Care', 'body-care', 'active'),
  ('Gift Sets', 'gift-sets', 'active')
on conflict (slug) do update set name = excluded.name, status = excluded.status;

update public.products p
set category_id = c.id
from public.categories c,
  (values
    ('saffron-face-wash', 'skincare'),
    ('night-repair-cream', 'skincare'),
    ('alpha-arbutin-serum', 'skincare'),
    ('vip-body-lotion', 'body-care'),
    ('botanical-hair-oil', 'haircare'),
    ('lash-brow-oil', 'haircare'),
    ('rosehip-glow-serum', 'skincare'),
    ('jasmine-facial-mist', 'skincare'),
    ('the-glow-collection', 'gift-sets')
  ) as mapping(product_slug, category_slug)
where p.slug = mapping.product_slug
  and c.slug = mapping.category_slug
  and p.category_id is null;

insert into public.skin_concerns(name, slug, status)
select seed.name, seed.slug, seed.status
from (values
  ('Brightening', 'brightening', 'active'),
  ('Acne Care', 'acne-care', 'active'),
  ('Pigmentation', 'pigmentation', 'active'),
  ('Dry Skin', 'dry-skin', 'active'),
  ('Sun Protection', 'sun-protection', 'active'),
  ('Body Care', 'body-care', 'active'),
  ('Anti-Aging', 'anti-aging', 'active'),
  ('Lip Care', 'lip-care', 'active'),
  ('Men''s Care', 'men-s-care', 'active'),
  ('Hair Care', 'hair-care', 'active'),
  ('Wellness', 'wellness', 'active')
) as seed(name, slug, status)
where not exists (select 1 from public.skin_concerns)
on conflict (slug) do update set name = excluded.name, status = excluded.status;

notify pgrst, 'reload schema';
