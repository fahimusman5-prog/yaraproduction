-- Repository representation of commerce tables that previously existed only
-- in the hosted migration history. Every statement is additive and safe for
-- the existing production database.

create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text not null check (country_code in ('LK','AE')),
  region_name text not null default '',
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
create unique index if not exists shipping_zones_country_region_key on public.shipping_zones(country_code, lower(region_name), lower(name));
create index if not exists shipping_methods_zone_active_idx on public.shipping_methods(shipping_zone_id, active, sort_order);

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
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (discount_type <> 'percentage' or discount_value <= 100)
);
create table if not exists public.coupon_products (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (coupon_id, product_id)
);
create table if not exists public.coupon_categories (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (coupon_id, category_id)
);
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_email text not null,
  customer_user_id uuid references public.profiles(id) on delete set null,
  discount_amount numeric(12,2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now()
);
create index if not exists coupons_active_code_idx on public.coupons(active, upper(code));
create index if not exists coupon_redemptions_customer_idx on public.coupon_redemptions(coupon_id, lower(customer_email));

create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  customer_email text not null,
  customer_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  customer_note text not null default '',
  admin_note text not null default '',
  status text not null default 'requested' check (status in ('requested','more_information','approved','rejected','received','inspected','restocked','resolved','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  received_at timestamptz,
  inspected_at timestamptz,
  resolved_at timestamptz
);
alter table public.return_requests
  add column if not exists approved_at timestamptz,
  add column if not exists received_at timestamptz,
  add column if not exists inspected_at timestamptz,
  add column if not exists resolved_at timestamptz;
alter table public.return_requests drop constraint if exists return_requests_status_check;
alter table public.return_requests add constraint return_requests_status_check
  check (status in ('requested','more_information','approved','rejected','received','inspected','restocked','resolved','cancelled'));
create table if not exists public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_request_id uuid not null references public.return_requests(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id),
  quantity integer not null check (quantity > 0),
  restocked_at timestamptz,
  unique(return_request_id, order_item_id)
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
  requested_product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0)
);
create table if not exists public.return_status_history (
  id uuid primary key default gen_random_uuid(),
  return_request_id uuid not null references public.return_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text not null default '',
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists return_requests_order_idx on public.return_requests(order_id, created_at desc);
create index if not exists return_status_history_request_idx on public.return_status_history(return_request_id, created_at);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  return_request_id uuid references public.return_requests(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null check (currency in ('LKR','AED')),
  refund_type text not null default 'partial' check (refund_type in ('full','partial')),
  status text not null default 'requested' check (status in ('requested','approved','processing','completed','rejected','failed')),
  reason text not null default '',
  internal_note text not null default '',
  provider_reference text not null default '',
  actor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.refunds
  add column if not exists return_request_id uuid references public.return_requests(id) on delete set null,
  add column if not exists refund_type text not null default 'partial',
  add column if not exists internal_note text not null default '',
  add column if not exists updated_at timestamptz not null default now();
alter table public.refunds drop constraint if exists refunds_status_check;
alter table public.refunds add constraint refunds_status_check
  check (status in ('requested','approved','processing','completed','rejected','failed'));
alter table public.refunds drop constraint if exists refunds_refund_type_check;
alter table public.refunds add constraint refunds_refund_type_check check (refund_type in ('full','partial'));
create table if not exists public.refund_items (
  refund_id uuid not null references public.refunds(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id),
  quantity integer not null check (quantity > 0),
  amount numeric(12,2) not null check (amount >= 0),
  primary key(refund_id, order_item_id)
);
create table if not exists public.refund_status_history (
  id uuid primary key default gen_random_uuid(),
  refund_id uuid not null references public.refunds(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text not null default '',
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists refunds_order_idx on public.refunds(order_id, created_at desc);

alter table public.shipping_zones enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_products enable row level security;
alter table public.coupon_categories enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.return_requests enable row level security;
alter table public.return_items enable row level security;
alter table public.return_images enable row level security;
alter table public.exchange_items enable row level security;
alter table public.return_status_history enable row level security;
alter table public.refunds enable row level security;
alter table public.refund_items enable row level security;
alter table public.refund_status_history enable row level security;

drop policy if exists return_requests_customer_select on public.return_requests;
create policy return_requests_customer_select on public.return_requests for select to authenticated
  using ((select auth.uid()) = customer_user_id);
drop policy if exists return_requests_customer_insert on public.return_requests;
create policy return_requests_customer_insert on public.return_requests for insert to authenticated
  with check ((select auth.uid()) = customer_user_id and status = 'requested');
drop policy if exists return_items_customer_select on public.return_items;
create policy return_items_customer_select on public.return_items for select to authenticated
  using (exists (select 1 from public.return_requests r where r.id = return_request_id and r.customer_user_id = (select auth.uid())));
drop policy if exists return_status_history_customer_select on public.return_status_history;
create policy return_status_history_customer_select on public.return_status_history for select to authenticated
  using (exists (select 1 from public.return_requests r where r.id = return_request_id and r.customer_user_id = (select auth.uid())));

do $$
declare v_table text;
begin
  foreach v_table in array array['shipping_zones','shipping_methods','coupons','coupon_products','coupon_categories','coupon_redemptions','return_requests','return_items','return_images','exchange_items','return_status_history','refunds','refund_items','refund_status_history']
  loop
    execute format('drop policy if exists staff_manage_%1$s on public.%1$I', v_table);
    execute format('create policy staff_manage_%1$s on public.%1$I for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()))', v_table);
  end loop;
end $$;

grant select, insert on public.return_requests to authenticated;
grant select on public.return_items, public.return_status_history to authenticated;
grant select, insert, update, delete on public.shipping_zones, public.shipping_methods, public.coupons,
  public.coupon_products, public.coupon_categories, public.coupon_redemptions, public.return_requests,
  public.return_items, public.return_images, public.exchange_items, public.return_status_history,
  public.refunds, public.refund_items, public.refund_status_history to authenticated;
