-- PayHere is approved for LKR only. Preserve legacy USD rows for history, but
-- make all new UAE attempts AED-accounted and LKR-charged.
update public.exchange_rates
set active = false, updated_at = now()
where source_currency = 'AED' and target_currency = 'USD' and active;

drop index if exists public.exchange_rates_one_active_aed_usd_idx;
create unique index if not exists exchange_rates_one_active_aed_lkr_idx
  on public.exchange_rates(source_currency, target_currency)
  where active and source_currency = 'AED' and target_currency = 'LKR';

alter table public.exchange_rates
  drop constraint if exists exchange_rates_target_currency_check;
alter table public.exchange_rates
  add constraint exchange_rates_target_currency_check
  check (target_currency in ('USD', 'LKR'));
alter table public.exchange_rates
  drop constraint if exists exchange_rates_rate_check;
alter table public.exchange_rates
  add constraint exchange_rates_rate_check
  check (rate > 0 and rate <= 1000);

drop function if exists public.prepare_payhere_payment_attempt(uuid, text, boolean);
create function public.prepare_payhere_payment_attempt(
  p_order_id uuid,
  p_environment text
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
  exchange_rate_effective_at timestamptz,
  exchange_rate_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
  v_rate public.exchange_rates%rowtype;
  v_charge_amount numeric(12,2);
begin
  if p_environment not in ('sandbox', 'live') then
    raise exception using errcode = '22023', message = 'Invalid PayHere environment.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_method <> 'card'
     or v_order.payment_provider <> 'payhere'
     or v_order.payment_status = 'paid' then
    raise exception using errcode = 'P0002', message = 'Eligible PayHere order not found.';
  end if;
  select * into v_attempt from public.payment_attempts
  where order_id = v_order.id and provider = 'payhere'
  order by created_at desc limit 1 for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'PayHere payment attempt not found.';
  end if;

  if v_attempt.status in ('pending', 'processing')
     and v_attempt.initiated_at is not null
     and v_attempt.charge_amount is not null
     and v_attempt.charge_currency = 'LKR' then
    return query select v_attempt.id, v_attempt.provider_order_id,
      v_attempt.source_currency, v_attempt.source_amount,
      v_attempt.charge_currency, v_attempt.charge_amount,
      v_attempt.locked_exchange_rate, v_attempt.exchange_rate_source,
      v_attempt.exchange_rate_effective_at,
      (select expires_at from public.exchange_rates where id = v_attempt.exchange_rate_id);
    return;
  end if;

  if v_attempt.status in ('failed', 'cancelled') then
    insert into public.payment_attempts(order_id, provider, provider_order_id, amount, currency, idempotency_key)
    values (v_order.id, 'payhere', v_order.order_number || '-R' ||
      (select count(*) + 1 from public.payment_attempts where order_id = v_order.id and provider = 'payhere'),
      v_order.total_amount, v_order.currency, gen_random_uuid())
    returning * into v_attempt;
  end if;

  if v_order.currency = 'LKR' and v_order.region_code = 'LK' then
    v_charge_amount := round(v_order.total_amount, 2);
    update public.payment_attempts set
      provider_environment = p_environment, source_currency = 'LKR', source_amount = v_order.total_amount,
      charge_currency = 'LKR', charge_amount = v_charge_amount, amount = v_charge_amount, currency = 'LKR',
      locked_exchange_rate = 1, exchange_rate_source = 'identity', exchange_rate_effective_at = now(),
      exchange_rate_id = null, initiated_at = coalesce(initiated_at, now()), updated_at = now()
    where id = v_attempt.id returning * into v_attempt;
  elsif v_order.currency = 'AED' and v_order.region_code = 'AE' then
    select * into v_rate from public.exchange_rates
    where source_currency = 'AED' and target_currency = 'LKR'
      and active and effective_from <= now() and (expires_at is null or expires_at > now()) and rate > 0
    order by effective_from desc limit 1 for share;
    if not found then
      raise exception using errcode = '23514', message = 'A valid AED to LKR exchange rate is unavailable.';
    end if;
    v_charge_amount := round(v_order.total_amount * v_rate.rate, 0);
    update public.payment_attempts set
      provider_environment = p_environment, source_currency = 'AED', source_amount = v_order.total_amount,
      charge_currency = 'LKR', charge_amount = v_charge_amount, amount = v_charge_amount, currency = 'LKR',
      locked_exchange_rate = v_rate.rate, exchange_rate_source = v_rate.rate_source,
      exchange_rate_effective_at = v_rate.effective_from, exchange_rate_id = v_rate.id,
      initiated_at = coalesce(initiated_at, now()), updated_at = now()
    where id = v_attempt.id returning * into v_attempt;
  else
    raise exception using errcode = '23514', message = 'Order region and currency do not match.';
  end if;
  return query select v_attempt.id, v_attempt.provider_order_id, v_attempt.source_currency,
    v_attempt.source_amount, v_attempt.charge_currency, v_attempt.charge_amount,
    v_attempt.locked_exchange_rate, v_attempt.exchange_rate_source, v_attempt.exchange_rate_effective_at,
    (select expires_at from public.exchange_rates where id = v_attempt.exchange_rate_id);
end;
$$;
revoke all on function public.prepare_payhere_payment_attempt(uuid, text) from public, anon, authenticated;
grant execute on function public.prepare_payhere_payment_attempt(uuid, text) to service_role;

alter table public.payment_attempts
  drop constraint if exists payment_attempts_currency_check;
alter table public.payment_attempts
  add constraint payment_attempts_currency_check check (currency in ('LKR', 'AED', 'USD'));
