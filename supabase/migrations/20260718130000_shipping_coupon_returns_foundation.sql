-- Additive operational foundation. No business fees are seeded or activated.

create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text not null check (country_code in ('LK','AE')),
  region_name text not null default '',
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, region_name)
);

create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  shipping_zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  name text not null,
  description text not null default '',
  fee numeric(12,2) not null check (fee >= 0),
  currency text not null check (currency in ('LKR','AED')),
  free_shipping_threshold numeric(12,2) check (free_shipping_threshold is null or free_shipping_threshold >= 0),
  estimated_min_days integer not null default 1 check (estimated_min_days >= 0),
  estimated_max_days integer not null default 3 check (estimated_max_days >= estimated_min_days),
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shipping_methods_zone_active_idx on public.shipping_methods(shipping_zone_id, active, sort_order);

alter table public.orders add column if not exists shipping_zone_id uuid references public.shipping_zones(id) on delete set null;
alter table public.orders add column if not exists shipping_method_id uuid references public.shipping_methods(id) on delete set null;
alter table public.orders add column if not exists shipping_method_name text not null default '';
alter table public.orders add column if not exists shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0);
alter table public.orders add column if not exists shipping_currency text check (shipping_currency is null or shipping_currency in ('LKR','AED'));
alter table public.orders add column if not exists courier_name text not null default '';
alter table public.orders add column if not exists tracking_number text not null default '';
alter table public.orders add column if not exists tracking_url text not null default '';
alter table public.orders add column if not exists estimated_delivery_date date;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists subtotal_amount numeric(12,2) not null default 0 check (subtotal_amount >= 0);
alter table public.orders add column if not exists discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0);
alter table public.orders add column if not exists coupon_code text not null default '';

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('fixed','percentage')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  country_scope text not null default 'both' check (country_scope in ('sri-lanka','uae','both')),
  starts_at timestamptz,
  ends_at timestamptz,
  minimum_order_amount numeric(12,2) not null default 0 check (minimum_order_amount >= 0),
  maximum_discount numeric(12,2) check (maximum_discount is null or maximum_discount >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_customer_limit integer not null default 1 check (per_customer_limit > 0),
  active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coupons_active_code_idx on public.coupons(code, active);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  customer_email text not null,
  customer_user_id uuid references public.profiles(id) on delete set null,
  discount_amount numeric(12,2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now()
);
create index if not exists coupon_redemptions_customer_idx on public.coupon_redemptions(coupon_id, customer_email);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null check (currency in ('LKR','AED')),
  status text not null default 'recorded' check (status in ('pending','recorded','completed','failed','cancelled')),
  reason text not null default '',
  provider_reference text not null default '',
  actor_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists refunds_order_idx on public.refunds(order_id, created_at desc);

create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  customer_email text not null,
  customer_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  customer_note text not null default '',
  admin_note text not null default '',
  status text not null default 'requested' check (status in ('requested','approved','rejected','received','restocked','resolved','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists return_requests_order_idx on public.return_requests(order_id, created_at desc);

create table if not exists public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_request_id uuid not null references public.return_requests(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  restocked_at timestamptz
);

create table if not exists public.return_images (
  id uuid primary key default gen_random_uuid(),
  return_request_id uuid not null references public.return_requests(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.exchange_items (
  id uuid primary key default gen_random_uuid(),
  return_request_id uuid not null references public.return_requests(id) on delete cascade,
  requested_product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0)
);

do $block$
declare t text;
begin
  foreach t in array array['shipping_zones','shipping_methods','coupons','coupon_redemptions','refunds','return_requests','return_items','return_images','exchange_items'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$block$;

drop policy if exists shipping_zones_staff_select on public.shipping_zones;
create policy shipping_zones_staff_select on public.shipping_zones for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
drop policy if exists shipping_methods_staff_select on public.shipping_methods;
create policy shipping_methods_staff_select on public.shipping_methods for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
drop policy if exists coupons_staff_select on public.coupons;
create policy coupons_staff_select on public.coupons for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
drop policy if exists coupon_redemptions_staff_select on public.coupon_redemptions;
create policy coupon_redemptions_staff_select on public.coupon_redemptions for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
drop policy if exists refunds_staff_select on public.refunds;
create policy refunds_staff_select on public.refunds for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
drop policy if exists return_requests_staff_select on public.return_requests;
create policy return_requests_staff_select on public.return_requests for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
drop policy if exists return_items_staff_select on public.return_items;
create policy return_items_staff_select on public.return_items for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
drop policy if exists return_images_staff_select on public.return_images;
create policy return_images_staff_select on public.return_images for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
drop policy if exists exchange_items_staff_select on public.exchange_items;
create policy exchange_items_staff_select on public.exchange_items for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
