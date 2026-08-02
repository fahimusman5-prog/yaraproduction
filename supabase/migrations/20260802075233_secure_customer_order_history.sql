-- Secure customer order history and auditable guest-order claiming.
-- Guest orders remain unlinked until a verified customer claims them.

alter table public.orders
  add column if not exists claimed_at timestamptz,
  add column if not exists claimed_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists claim_method text;

alter table public.orders
  drop constraint if exists orders_claim_method_check;
alter table public.orders
  add constraint orders_claim_method_check
  check (claim_method is null or claim_method in ('verified_email', 'admin_verified_link'));

create index if not exists orders_claimed_by_user_id_idx
  on public.orders(claimed_by_user_id)
  where claimed_by_user_id is not null;

create table if not exists public.order_claim_audit (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  claimed_by_user_id uuid not null references public.profiles(id) on delete restrict,
  claim_method text not null check (claim_method in ('verified_email', 'admin_verified_link')),
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (order_id, claim_method)
);

create index if not exists order_claim_audit_actor_idx
  on public.order_claim_audit(actor_user_id, created_at desc);

alter table public.order_claim_audit enable row level security;
revoke all on public.order_claim_audit from anon, authenticated;
grant all on public.order_claim_audit to service_role;

drop policy if exists order_events_staff_select on public.order_events;
create policy order_events_customer_or_staff_select
  on public.order_events for select to authenticated
  using (
    (select private.is_staff())
    or exists (
      select 1 from public.orders o
      where o.id = order_events.order_id
        and o.customer_user_id = (select auth.uid())
    )
  );

grant select on public.order_events to authenticated;
