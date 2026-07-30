-- Preserve commercial order currency while locking the exact PayHere charge.

create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  source_currency text not null check (source_currency = 'AED'),
  target_currency text not null check (target_currency = 'USD'),
  rate numeric(18,8) not null check (rate > 0 and rate between 0.05 and 1),
  effective_from timestamptz not null,
  expires_at timestamptz not null,
  active boolean not null default true,
  rate_source text not null default 'admin-approved'
    check (length(trim(rate_source)) between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  check (expires_at > effective_from)
);

create unique index if not exists exchange_rates_one_active_aed_usd_idx
  on public.exchange_rates(source_currency, target_currency)
  where active;

alter table public.exchange_rates enable row level security;
revoke all on public.exchange_rates from public, anon, authenticated;
grant select, insert, update on public.exchange_rates to authenticated;

drop policy if exists exchange_rates_admin_read on public.exchange_rates;
create policy exchange_rates_admin_read on public.exchange_rates
  for select to authenticated using ((select private.is_admin()));
drop policy if exists exchange_rates_admin_insert on public.exchange_rates;
create policy exchange_rates_admin_insert on public.exchange_rates
  for insert to authenticated with check ((select private.is_admin()));
drop policy if exists exchange_rates_admin_update on public.exchange_rates;
create policy exchange_rates_admin_update on public.exchange_rates
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter table public.payment_attempts
  add column if not exists provider_environment text
    check (provider_environment in ('sandbox', 'live')),
  add column if not exists source_currency text
    check (source_currency in ('LKR', 'AED')),
  add column if not exists source_amount numeric(12,2)
    check (source_amount is null or source_amount >= 0),
  add column if not exists charge_currency text
    check (charge_currency in ('LKR', 'USD')),
  add column if not exists charge_amount numeric(12,2)
    check (charge_amount is null or charge_amount >= 0),
  add column if not exists locked_exchange_rate numeric(18,8)
    check (locked_exchange_rate is null or locked_exchange_rate > 0),
  add column if not exists exchange_rate_source text,
  add column if not exists exchange_rate_effective_at timestamptz,
  add column if not exists exchange_rate_id uuid
    references public.exchange_rates(id),
  add column if not exists provider_status_code integer,
  add column if not exists provider_status_message text,
  add column if not exists initiated_at timestamptz,
  add column if not exists failed_at timestamptz;

alter table public.payment_attempts
  drop constraint if exists payment_attempts_currency_check;
alter table public.payment_attempts
  add constraint payment_attempts_currency_check
  check (currency in ('LKR', 'AED', 'USD'));

create unique index if not exists payment_attempts_order_provider_key_idx
  on public.payment_attempts(order_id, provider, idempotency_key);
create unique index if not exists payment_attempts_provider_order_idx
  on public.payment_attempts(provider, provider_order_id);

create or replace function public.prepare_payhere_payment_attempt(
  p_order_id uuid,
  p_environment text,
  p_allow_usd boolean
)
returns table(
  attempt_id uuid,
  provider_order_id text,
  source_currency text,
  source_amount numeric,
  charge_currency text,
  charge_amount numeric,
  locked_exchange_rate numeric,
  exchange_rate_source text,
  exchange_rate_effective_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
  v_rate public.exchange_rates%rowtype;
  v_charge_currency text;
  v_charge_amount numeric(12,2);
  v_locked_rate numeric(18,8);
  v_rate_source text;
  v_rate_effective timestamptz;
  v_rate_id uuid;
begin
  if p_environment not in ('sandbox', 'live') then
    raise exception using errcode = '22023',
      message = 'Invalid PayHere environment.';
  end if;
  select * into v_order from public.orders
  where id = p_order_id for update;
  if not found or v_order.payment_method <> 'card'
     or v_order.payment_provider <> 'payhere'
     or v_order.payment_status = 'paid' then
    raise exception using errcode = 'P0002',
      message = 'Eligible PayHere order not found.';
  end if;

  select * into v_attempt from public.payment_attempts
  where order_id = v_order.id and provider = 'payhere'
  order by created_at desc
  limit 1 for update;
  if not found then
    raise exception using errcode = 'P0002',
      message = 'PayHere payment attempt not found.';
  end if;

  -- Duplicate clicks reuse an already locked eligible attempt. A later rate
  -- update can never change the amount the customer already approved.
  if v_attempt.status in ('pending', 'processing')
     and v_attempt.initiated_at is not null
     and v_attempt.charge_amount is not null
     and v_attempt.charge_currency is not null then
    return query select
      v_attempt.id, v_attempt.provider_order_id,
      v_attempt.source_currency, v_attempt.source_amount,
      v_attempt.charge_currency, v_attempt.charge_amount,
      v_attempt.locked_exchange_rate, v_attempt.exchange_rate_source,
      v_attempt.exchange_rate_effective_at;
    return;
  end if;

  -- A retry keeps the commercial order but receives a distinct provider
  -- attempt and provider order id.
  if v_attempt.status in ('failed', 'cancelled') then
    insert into public.payment_attempts(
      order_id, provider, provider_order_id, amount, currency, idempotency_key
    ) values (
      v_order.id, 'payhere',
      v_order.order_number || '-R' ||
        (select count(*) + 1 from public.payment_attempts
         where order_id = v_order.id and provider = 'payhere'),
      v_order.total_amount, v_order.currency, gen_random_uuid()
    ) returning * into v_attempt;
  end if;

  if v_order.currency = 'LKR' and v_order.region_code = 'LK' then
    v_charge_currency := 'LKR';
    v_charge_amount := round(v_order.total_amount, 2);
    v_locked_rate := 1;
    v_rate_source := 'identity';
    v_rate_effective := now();
  elsif v_order.currency = 'AED' and v_order.region_code = 'AE' then
    if not p_allow_usd then
      raise exception using errcode = '23514',
        message = 'PayHere USD capability is not approved.';
    end if;
    select * into v_rate from public.exchange_rates
    where source_currency = 'AED' and target_currency = 'USD'
      and active and effective_from <= now() and expires_at > now()
      and rate between 0.05 and 1
    order by effective_from desc limit 1 for share;
    if not found then
      raise exception using errcode = '23514',
        message = 'A valid AED to USD exchange rate is unavailable.';
    end if;
    v_charge_currency := 'USD';
    v_charge_amount := round(v_order.total_amount * v_rate.rate, 2);
    v_locked_rate := v_rate.rate;
    v_rate_source := v_rate.rate_source;
    v_rate_effective := v_rate.effective_from;
    v_rate_id := v_rate.id;
  else
    raise exception using errcode = '23514',
      message = 'Order region and currency do not match.';
  end if;

  update public.payment_attempts set
    provider_environment = p_environment,
    provider_order_id = coalesce(provider_order_id, v_order.order_number),
    source_currency = v_order.currency,
    source_amount = v_order.total_amount,
    charge_currency = v_charge_currency,
    charge_amount = v_charge_amount,
    amount = v_charge_amount,
    currency = v_charge_currency,
    locked_exchange_rate = v_locked_rate,
    exchange_rate_source = v_rate_source,
    exchange_rate_effective_at = v_rate_effective,
    exchange_rate_id = v_rate_id,
    initiated_at = coalesce(initiated_at, now()),
    updated_at = now()
  where id = v_attempt.id
  returning * into v_attempt;

  return query select
    v_attempt.id, v_attempt.provider_order_id,
    v_attempt.source_currency, v_attempt.source_amount,
    v_attempt.charge_currency, v_attempt.charge_amount,
    v_attempt.locked_exchange_rate, v_attempt.exchange_rate_source,
    v_attempt.exchange_rate_effective_at;
end;
$$;
revoke all on function public.prepare_payhere_payment_attempt(
  uuid,text,boolean
) from public, anon, authenticated;
grant execute on function public.prepare_payhere_payment_attempt(
  uuid,text,boolean
) to service_role;

create or replace function public.update_payhere_payment(
  p_order_number text,
  p_provider_payment_id text,
  p_status_code integer,
  p_amount numeric,
  p_currency text,
  p_status_message text default ''
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
  v_item record;
  v_product public.products%rowtype;
begin
  select * into v_attempt from public.payment_attempts
  where provider = 'payhere' and provider_order_id = p_order_number
  for update;
  if not found or v_attempt.charge_amount is null
     or v_attempt.charge_currency is null then
    raise exception using errcode = 'P0002',
      message = 'Payment attempt not found';
  end if;
  if v_attempt.charge_amount <> p_amount
     or v_attempt.charge_currency <> p_currency then
    raise exception using errcode = '23514',
      message = 'Payment amount or currency mismatch';
  end if;
  select * into v_order from public.orders
  where id = v_attempt.order_id for update;
  if not found or v_order.payment_method <> 'card'
     or v_order.payment_provider <> 'payhere' then
    raise exception using errcode = 'P0002', message = 'Order not found';
  end if;
  if p_status_code = -3 then
    if v_attempt.provider_status_code = -3 then return false; end if;
    update public.orders set
      provider_payment_id = nullif(p_provider_payment_id, ''),
      provider_status_code = -3,
      payment_updated_at = now()
    where id = v_order.id;
    update public.payment_attempts set
      provider_payment_id = nullif(p_provider_payment_id, ''),
      provider_status_code = -3,
      provider_status_message = left(coalesce(p_status_message, ''), 500),
      status = 'failed',
      failed_at = now(),
      raw_status = '-3',
      updated_at = now()
    where id = v_attempt.id;
    return true;
  end if;
  if v_order.payment_status = 'paid' then return false; end if;

  if p_status_code = 2 and v_order.inventory_finalized_at is null then
    for v_item in select product_id, quantity from public.order_items
      where order_id = v_order.id order by product_id
    loop
      select * into v_product from public.products
      where id = v_item.product_id for update;
      if v_product.stock_quantity < v_item.quantity then
        raise exception using errcode = '23514',
          message = 'Insufficient stock for ' || v_product.name;
      end if;
      update public.products
      set stock_quantity = v_product.stock_quantity - v_item.quantity
      where id = v_product.id;
      insert into public.stock_movements(
        product_id,movement_type,quantity_change,previous_stock,new_stock,
        reference_id
      ) values (
        v_product.id,'online_order',-v_item.quantity,
        v_product.stock_quantity,v_product.stock_quantity-v_item.quantity,
        v_order.id
      );
    end loop;
  end if;

  update public.orders set
    provider_payment_id = nullif(p_provider_payment_id, ''),
    provider_status_code = p_status_code,
    payment_updated_at = now(),
    payment_status = case p_status_code
      when 2 then 'paid' when 0 then 'pending'
      when -1 then 'cancelled' when -2 then 'failed'
      when -3 then 'failed' else 'failed' end,
    order_status = case p_status_code
      when 2 then 'confirmed' when 0 then 'pending_payment'
      when -1 then 'pending_payment' when -2 then 'payment_failed'
      when -3 then 'payment_failed' else 'payment_failed' end,
    paid_at = case when p_status_code = 2 then now() else paid_at end,
    confirmed_at = case when p_status_code = 2 then now() else confirmed_at end,
    inventory_finalized_at = case
      when p_status_code = 2 then coalesce(inventory_finalized_at, now())
      else inventory_finalized_at end
  where id = v_order.id;

  update public.payment_attempts set
    provider_payment_id = nullif(p_provider_payment_id, ''),
    provider_status_code = p_status_code,
    provider_status_message = left(coalesce(p_status_message, ''), 500),
    status = case p_status_code
      when 2 then 'paid' when 0 then 'pending'
      when -1 then 'cancelled' else 'failed' end,
    verified_at = case when p_status_code = 2 then now() else verified_at end,
    failed_at = case when p_status_code in (-1,-2,-3) then now() end,
    raw_status = p_status_code::text,
    updated_at = now()
  where id = v_attempt.id;
  return true;
end;
$$;
revoke all on function public.update_payhere_payment(
  text,text,integer,numeric,text,text
) from public, anon, authenticated;
grant execute on function public.update_payhere_payment(
  text,text,integer,numeric,text,text
) to service_role;
