-- Customer self-service, payment auditability, and fulfilment metadata.
-- This migration is additive and preserves existing commerce records.

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home' check (char_length(label) between 1 and 60),
  recipient_name text not null check (char_length(recipient_name) between 2 and 200),
  phone text not null check (char_length(phone) between 6 and 50),
  address text not null check (char_length(address) between 5 and 500),
  city text not null check (char_length(city) between 2 and 160),
  postal_code text not null default '' check (char_length(postal_code) <= 40),
  country text not null check (country in ('sri-lanka', 'uae')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_user_id_idx on public.customer_addresses(user_id);
create unique index if not exists customer_addresses_one_default_idx on public.customer_addresses(user_id) where is_default;
alter table public.customer_addresses enable row level security;
drop policy if exists "Customers manage own addresses" on public.customer_addresses;
create policy "Customers manage own addresses" on public.customer_addresses
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.customer_addresses to authenticated;

alter table public.product_reviews add column if not exists customer_user_id uuid references public.profiles(id) on delete set null;
alter table public.product_reviews add column if not exists moderation_note text;
create unique index if not exists product_reviews_customer_product_key
  on public.product_reviews(customer_user_id, product_id)
  where customer_user_id is not null;
drop policy if exists "Customers submit own hidden reviews" on public.product_reviews;
create policy "Customers submit own hidden reviews" on public.product_reviews
  for insert to authenticated
  with check ((select auth.uid()) = customer_user_id and status = 'hidden');
drop policy if exists "Customers view own reviews" on public.product_reviews;
create policy "Customers view own reviews" on public.product_reviews
  for select to authenticated
  using (status = 'published' or (select auth.uid()) = customer_user_id or (select private.is_staff()));

alter table public.orders add column if not exists subtotal_amount numeric(12,2) not null default 0 check (subtotal_amount >= 0);
alter table public.orders add column if not exists shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0);
alter table public.orders add column if not exists discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0);
alter table public.orders add column if not exists shipping_method_name text not null default '';
alter table public.orders add column if not exists courier_name text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists terms_accepted_at timestamptz;
alter table public.orders add column if not exists idempotency_key uuid;
create unique index if not exists orders_idempotency_key_key on public.orders(idempotency_key) where idempotency_key is not null;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_event_id text,
  provider_payment_id text,
  payment_status text not null check (payment_status in ('not_initiated','pending','paid','failed','cancelled','refunded','partially_refunded')),
  amount numeric(12,2) check (amount is null or amount >= 0),
  currency text check (currency is null or currency in ('LKR','AED')),
  payload_fingerprint text,
  created_at timestamptz not null default now()
);
create unique index if not exists payment_events_provider_event_key
  on public.payment_events(provider, provider_event_id)
  where provider_event_id is not null;
create index if not exists payment_events_order_created_idx on public.payment_events(order_id, created_at desc);
alter table public.payment_events enable row level security;
drop policy if exists "Staff view payment events" on public.payment_events;
create policy "Staff view payment events" on public.payment_events for select to authenticated using ((select private.is_staff()));
grant select on public.payment_events to authenticated;

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  recipient text not null,
  channel text not null check (channel in ('email','sms','whatsapp')),
  template text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  provider_message_id text,
  last_error text,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists notification_events_status_created_idx on public.notification_events(status, created_at);
alter table public.notification_events enable row level security;
drop policy if exists "Staff view notification events" on public.notification_events;
create policy "Staff view notification events" on public.notification_events for select to authenticated using ((select private.is_staff()));
grant select on public.notification_events to authenticated;
