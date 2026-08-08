alter table public.notification_events
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();
create unique index if not exists notification_events_dedupe_key
  on public.notification_events(order_id, lower(recipient), template)
  where order_id is not null;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name ~ '^[a-z][a-z0-9_]{1,63}$'),
  anonymous_id uuid not null,
  session_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  country text check (country is null or country in ('sri-lanka','uae')),
  locale text check (locale is null or locale in ('en','si','ta','ar')),
  currency text check (currency is null or currency in ('LKR','AED')),
  value numeric(12,2) check (value is null or value >= 0),
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (octet_length(properties::text) <= 8192)
);
create index if not exists analytics_events_name_occurred_idx on public.analytics_events(event_name, occurred_at desc);
create index if not exists analytics_events_user_occurred_idx on public.analytics_events(user_id, occurred_at desc) where user_id is not null;
alter table public.analytics_events enable row level security;
drop policy if exists analytics_events_staff_select on public.analytics_events;
create policy analytics_events_staff_select on public.analytics_events for select to authenticated using ((select private.is_staff()));
grant select on public.analytics_events to authenticated;

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  requested_email text not null,
  status text not null default 'pending' check (status in ('pending','cancelled','processing','completed','failed')),
  reason text not null default '',
  requested_at timestamptz not null default now(),
  cancellable_until timestamptz not null default (now() + interval '7 days'),
  cancelled_at timestamptz,
  completed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null,
  processing_note text not null default '',
  updated_at timestamptz not null default now()
);
create unique index if not exists account_deletion_one_active_key on public.account_deletion_requests(user_id)
  where user_id is not null and status in ('pending','processing');
create index if not exists account_deletion_status_requested_idx on public.account_deletion_requests(status, requested_at);
alter table public.account_deletion_requests enable row level security;
drop policy if exists account_deletion_customer_select on public.account_deletion_requests;
create policy account_deletion_customer_select on public.account_deletion_requests for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists account_deletion_customer_insert on public.account_deletion_requests;
create policy account_deletion_customer_insert on public.account_deletion_requests for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');
drop policy if exists account_deletion_customer_cancel on public.account_deletion_requests;
create policy account_deletion_customer_cancel on public.account_deletion_requests for update to authenticated
  using ((select auth.uid()) = user_id and status = 'pending' and now() <= cancellable_until)
  with check ((select auth.uid()) = user_id and status = 'cancelled');
drop policy if exists account_deletion_staff_manage on public.account_deletion_requests;
create policy account_deletion_staff_manage on public.account_deletion_requests for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
grant select, insert, update on public.account_deletion_requests to authenticated;

create or replace function public.anonymize_customer_for_deletion(p_user_id uuid, p_actor_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_request public.account_deletion_requests%rowtype;
begin
  if not exists (select 1 from public.profiles where id = p_actor_id and role = 'admin') then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;
  select * into v_request from public.account_deletion_requests
    where user_id = p_user_id and status in ('pending','processing') order by requested_at desc limit 1 for update;
  if not found then raise exception using errcode = 'P0002', message = 'Active deletion request not found.'; end if;
  update public.account_deletion_requests set status = 'processing', processed_by = p_actor_id, updated_at = now() where id = v_request.id;
  delete from public.customer_addresses where user_id = p_user_id;
  update public.product_reviews set customer_user_id = null, customer_name = 'Deleted customer' where customer_user_id = p_user_id;
  update public.orders set customer_user_id = null, customer_name = 'Deleted customer',
    customer_email = 'deleted+' || substr(id::text, 1, 12) || '@privacy.invalid',
    customer_phone = '', shipping_address = '[retained order anonymised]',
    shipping_city = '', shipping_postal_code = '', shipping_address_snapshot = '{}'::jsonb
  where customer_user_id = p_user_id;
  update public.return_requests set customer_user_id = null,
    customer_email = 'deleted+' || substr(id::text, 1, 12) || '@privacy.invalid',
    customer_note = '[customer note removed]'
  where customer_user_id = p_user_id;
  update public.coupon_redemptions set customer_user_id = null,
    customer_email = 'deleted+' || substr(id::text, 1, 12) || '@privacy.invalid'
  where customer_user_id = p_user_id;
  update public.account_deletion_requests set status = 'processing',
    updated_at = now() where id = v_request.id;
  return true;
end;
$$;
revoke all on function public.anonymize_customer_for_deletion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.anonymize_customer_for_deletion(uuid, uuid) to service_role;
