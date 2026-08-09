-- Repair PayHere initialization after order creation failed because the
-- RETURNS TABLE output variable `order_id` conflicted with an unqualified
-- public.order_items.order_id reference in the online-payment stock loop.
-- Qualify database columns explicitly so PostgreSQL never has to choose
-- between PL/pgSQL variables and table columns.
create or replace function public.create_payment_order_with_coupon(
  p_customer jsonb,
  p_country text,
  p_payment_method text,
  p_items jsonb,
  p_idempotency_key uuid,
  p_customer_user_id uuid default null,
  p_coupon_code text default null,
  p_bank_transaction_reference text default null,
  p_policy_acceptance jsonb default '{}'::jsonb
)
returns table(
  order_id uuid, order_number text, total_amount numeric, currency text,
  created boolean, discount_amount numeric, coupon_code text,
  payment_fee numeric, processing_fee_percent numeric, payment_status text,
  order_status text, provider_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base_method text;
  v_created record;
  v_order public.orders%rowtype;
  v_setting public.payment_method_settings%rowtype;
  v_base numeric(12,2);
  v_fee numeric(12,2);
  v_item record;
  v_product public.products%rowtype;
begin
  if p_payment_method not in (
    'card', 'koko', 'mintpay', 'bank_transfer', 'cash_on_delivery'
  ) then
    raise exception using errcode = '22023', message = 'Invalid payment method.';
  end if;
  if coalesce((p_policy_acceptance->>'accepted')::boolean, false) is not true then
    raise exception using errcode = '23514',
      message = 'Policy acceptance is required.';
  end if;

  select pms.* into v_setting
  from public.payment_method_settings as pms
  where pms.region_code = case when p_country = 'sri-lanka' then 'LK' else 'AE' end
    and pms.payment_method = p_payment_method
  for share;
  if not found or not v_setting.is_enabled then
    raise exception using errcode = '23514',
      message = 'The selected payment method is unavailable.';
  end if;

  v_base_method := case
    when p_payment_method = 'cash_on_delivery' then 'cod'
    else 'payhere'
  end;
  select created_order.* into v_created
  from public.create_storefront_order_with_coupon(
    p_customer, p_country, v_base_method, p_items, p_idempotency_key,
    p_customer_user_id, p_coupon_code
  ) as created_order;
  select o.* into v_order
  from public.orders as o
  where o.id = v_created.order_id
  for update;

  if not v_created.created then
    if v_order.payment_method <> p_payment_method then
      raise exception using errcode = '23505',
        message = 'Idempotency key is already in use.';
    end if;
    return query select v_order.id, v_order.order_number, v_order.total_amount,
      v_order.currency, false, v_order.discount_amount, v_order.coupon_code,
      v_order.payment_fee, v_order.processing_fee_percent,
      v_order.payment_status, v_order.order_status, v_order.payment_provider;
    return;
  end if;

  v_base := greatest(0, v_order.subtotal_amount - v_order.discount_amount)
    + v_order.shipping_fee;
  if v_setting.minimum_order_amount is not null
     and v_base < v_setting.minimum_order_amount then
    raise exception using errcode = '23514',
      message = 'Order does not meet the payment method minimum.';
  end if;
  if v_setting.maximum_order_amount is not null
     and v_base > v_setting.maximum_order_amount then
    raise exception using errcode = '23514',
      message = 'Order exceeds the payment method maximum.';
  end if;
  v_fee := round(v_base * v_setting.processing_fee_percent / 100, 2);

  -- The legacy atomic checkout reserves stock for every new order. Online
  -- payments must not consume stock until a verified provider callback, so
  -- reverse that reservation inside this same transaction.
  if p_payment_method in ('card', 'koko', 'mintpay') then
    for v_item in
      select oi.product_id, oi.quantity
      from public.order_items as oi
      where oi.order_id = v_order.id
      order by oi.product_id
    loop
      select p.* into v_product
      from public.products as p
      where p.id = v_item.product_id
      for update;
      update public.products as p
      set stock_quantity = v_product.stock_quantity + v_item.quantity
      where p.id = v_product.id;
      insert into public.stock_movements(
        product_id, movement_type, quantity_change, previous_stock,
        new_stock, reference_id
      ) values (
        v_product.id, 'manual_adjustment', v_item.quantity,
        v_product.stock_quantity, v_product.stock_quantity + v_item.quantity,
        v_order.id
      );
    end loop;
  end if;

  update public.orders as o set
    payment_method = p_payment_method,
    payment_provider = v_setting.provider_name,
    processing_fee_percent = v_setting.processing_fee_percent,
    payment_fee = v_fee,
    total_amount = v_base + v_fee,
    bank_transaction_reference = nullif(left(trim(coalesce(p_bank_transaction_reference, '')), 200), ''),
    policy_acceptance = p_policy_acceptance,
    payment_status = case p_payment_method
      when 'cash_on_delivery' then 'payment_due_on_delivery'
      when 'bank_transfer' then 'awaiting_bank_verification'
      else 'pending'
    end,
    order_status = case p_payment_method
      when 'cash_on_delivery' then 'confirmed'
      when 'bank_transfer' then 'awaiting_bank_transfer'
      else 'pending_payment'
    end,
    confirmed_at = case when p_payment_method = 'cash_on_delivery' then now() end,
    inventory_finalized_at = case
      when p_payment_method in ('cash_on_delivery', 'bank_transfer') then now()
    end
  where o.id = v_order.id
  returning o.* into v_order;

  if p_payment_method in ('card', 'koko', 'mintpay') then
    insert into public.payment_attempts(
      order_id, provider, provider_order_id, amount, currency, idempotency_key
    ) values (
      v_order.id, coalesce(v_setting.provider_name, p_payment_method),
      v_order.order_number, v_order.total_amount, v_order.currency,
      p_idempotency_key
    );
  end if;

  return query select v_order.id, v_order.order_number, v_order.total_amount,
    v_order.currency, true, v_order.discount_amount, v_order.coupon_code,
    v_order.payment_fee, v_order.processing_fee_percent,
    v_order.payment_status, v_order.order_status, v_order.payment_provider;
end;
$$;
revoke all on function public.create_payment_order_with_coupon(
  jsonb,text,text,jsonb,uuid,uuid,text,text,jsonb
) from public, anon, authenticated;
grant execute on function public.create_payment_order_with_coupon(
  jsonb,text,text,jsonb,uuid,uuid,text,text,jsonb
) to service_role;

-- The UAE exchange-rate branch had the same latent variable/column conflict:
-- source_currency is also a RETURNS TABLE output. Qualify the payment-attempt
-- and exchange-rate queries while preserving the existing LKR-only contract.
create or replace function public.prepare_payhere_payment_attempt(
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
  select o.* into v_order
  from public.orders as o
  where o.id = p_order_id
  for update;
  if not found or v_order.payment_method <> 'card'
     or v_order.payment_provider <> 'payhere'
     or v_order.payment_status = 'paid' then
    raise exception using errcode = 'P0002', message = 'Eligible PayHere order not found.';
  end if;
  select pa.* into v_attempt
  from public.payment_attempts as pa
  where pa.order_id = v_order.id and pa.provider = 'payhere'
  order by pa.created_at desc
  limit 1
  for update;
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
      (select er.expires_at from public.exchange_rates as er
       where er.id = v_attempt.exchange_rate_id);
    return;
  end if;

  if v_attempt.status in ('failed', 'cancelled') then
    insert into public.payment_attempts(
      order_id, provider, provider_order_id, amount, currency, idempotency_key
    ) values (
      v_order.id, 'payhere', v_order.order_number || '-R' ||
        (select count(*) + 1
         from public.payment_attempts as retry_attempt
         where retry_attempt.order_id = v_order.id
           and retry_attempt.provider = 'payhere'),
      v_order.total_amount, v_order.currency, gen_random_uuid()
    )
    returning * into v_attempt;
  end if;

  if v_order.currency = 'LKR' and v_order.region_code = 'LK' then
    v_charge_amount := round(v_order.total_amount, 2);
    update public.payment_attempts as pa set
      provider_environment = p_environment,
      source_currency = 'LKR',
      source_amount = v_order.total_amount,
      charge_currency = 'LKR',
      charge_amount = v_charge_amount,
      amount = v_charge_amount,
      currency = 'LKR',
      locked_exchange_rate = 1,
      exchange_rate_source = 'identity',
      exchange_rate_effective_at = now(),
      exchange_rate_id = null,
      initiated_at = coalesce(pa.initiated_at, now()),
      updated_at = now()
    where pa.id = v_attempt.id
    returning pa.* into v_attempt;
  elsif v_order.currency = 'AED' and v_order.region_code = 'AE' then
    select er.* into v_rate
    from public.exchange_rates as er
    where er.source_currency = 'AED'
      and er.target_currency = 'LKR'
      and er.active
      and er.effective_from <= now()
      and (er.expires_at is null or er.expires_at > now())
      and er.rate > 0
    order by er.effective_from desc
    limit 1
    for share;
    if not found then
      raise exception using errcode = '23514', message = 'A valid AED to LKR exchange rate is unavailable.';
    end if;
    v_charge_amount := round(v_order.total_amount * v_rate.rate, 0);
    update public.payment_attempts as pa set
      provider_environment = p_environment,
      source_currency = 'AED',
      source_amount = v_order.total_amount,
      charge_currency = 'LKR',
      charge_amount = v_charge_amount,
      amount = v_charge_amount,
      currency = 'LKR',
      locked_exchange_rate = v_rate.rate,
      exchange_rate_source = v_rate.rate_source,
      exchange_rate_effective_at = v_rate.effective_from,
      exchange_rate_id = v_rate.id,
      initiated_at = coalesce(pa.initiated_at, now()),
      updated_at = now()
    where pa.id = v_attempt.id
    returning pa.* into v_attempt;
  else
    raise exception using errcode = '23514', message = 'Order region and currency do not match.';
  end if;
  return query select v_attempt.id, v_attempt.provider_order_id,
    v_attempt.source_currency, v_attempt.source_amount,
    v_attempt.charge_currency, v_attempt.charge_amount,
    v_attempt.locked_exchange_rate, v_attempt.exchange_rate_source,
    v_attempt.exchange_rate_effective_at,
    (select er.expires_at from public.exchange_rates as er
     where er.id = v_attempt.exchange_rate_id);
end;
$$;
revoke all on function public.prepare_payhere_payment_attempt(uuid, text)
  from public, anon, authenticated;
grant execute on function public.prepare_payhere_payment_attempt(uuid, text)
  to service_role;
