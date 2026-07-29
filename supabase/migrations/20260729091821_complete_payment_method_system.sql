-- Complete order-level payment method configuration and immutable pricing
-- snapshots. Processing fees are calculated from:
--   (product subtotal - discount + delivery fee) * configured percentage.

create table if not exists public.payment_method_settings (
  id uuid primary key default gen_random_uuid(),
  region_code text not null check (region_code in ('LK', 'AE')),
  currency text not null check (
    (region_code = 'LK' and currency = 'LKR') or
    (region_code = 'AE' and currency = 'AED')
  ),
  payment_method text not null check (
    payment_method in ('card', 'koko', 'mintpay', 'bank_transfer', 'cash_on_delivery')
  ),
  provider_name text,
  processing_fee_percent numeric(6,3) not null default 0
    check (processing_fee_percent >= 0 and processing_fee_percent <= 100),
  is_enabled boolean not null default false,
  minimum_order_amount numeric(12,2) check (minimum_order_amount is null or minimum_order_amount >= 0),
  maximum_order_amount numeric(12,2) check (
    maximum_order_amount is null or maximum_order_amount >= 0
  ),
  account_holder_name text,
  bank_name text,
  branch_name text,
  account_number text,
  swift_code text,
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(region_code, payment_method),
  check (
    maximum_order_amount is null or minimum_order_amount is null
    or maximum_order_amount >= minimum_order_amount
  )
);

alter table public.payment_method_settings enable row level security;
revoke all on public.payment_method_settings from anon, authenticated;
grant select on public.payment_method_settings to anon;
grant select, insert, update on public.payment_method_settings to authenticated;

drop policy if exists payment_method_settings_public_read_enabled
  on public.payment_method_settings;
create policy payment_method_settings_public_read_enabled
  on public.payment_method_settings for select to anon, authenticated
  using (is_enabled);

drop policy if exists payment_method_settings_admin_read
  on public.payment_method_settings;
create policy payment_method_settings_admin_read
  on public.payment_method_settings for select to authenticated
  using ((select private.is_admin()));

drop policy if exists payment_method_settings_admin_write
  on public.payment_method_settings;
create policy payment_method_settings_admin_write
  on public.payment_method_settings for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

insert into public.payment_method_settings (
  region_code, currency, payment_method, provider_name,
  processing_fee_percent, is_enabled
)
select region_code, currency, method, provider, fee, enabled
from (values
  ('LK','LKR','card','payhere',4::numeric,true),
  ('LK','LKR','koko','koko',9::numeric,false),
  ('LK','LKR','mintpay','mintpay',4::numeric,false),
  ('LK','LKR','bank_transfer',null,0::numeric,false),
  ('LK','LKR','cash_on_delivery',null,0::numeric,true),
  ('AE','AED','card','payhere',4::numeric,false),
  ('AE','AED','koko','koko',9::numeric,false),
  ('AE','AED','mintpay','mintpay',4::numeric,false),
  ('AE','AED','bank_transfer',null,0::numeric,false),
  ('AE','AED','cash_on_delivery',null,0::numeric,false)
) seed(region_code, currency, method, provider, fee, enabled)
on conflict (region_code, payment_method) do nothing;

alter table public.orders
  add column if not exists processing_fee_percent numeric(6,3) not null default 0,
  add column if not exists provider_order_id text,
  add column if not exists bank_transaction_reference text,
  add column if not exists paid_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists inventory_finalized_at timestamptz,
  add column if not exists policy_acceptance jsonb not null default '{}'::jsonb;

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in (
    'payhere', 'cod', 'card', 'koko', 'mintpay',
    'bank_transfer', 'cash_on_delivery'
  ));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in (
    'unpaid', 'pending', 'processing', 'paid', 'failed', 'cancelled',
    'refunded', 'payment_due_on_delivery', 'awaiting_bank_verification'
  ));
alter table public.orders drop constraint if exists orders_order_status_check;
alter table public.orders add constraint orders_order_status_check
  check (order_status in (
    'draft', 'pending', 'pending_payment', 'awaiting_bank_transfer',
    'confirmed', 'paid', 'processing', 'packed', 'shipped', 'delivered',
    'cancelled', 'payment_failed', 'refunded'
  ));

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_order_id text,
  provider_payment_id text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null check (currency in ('LKR', 'AED')),
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')
  ),
  idempotency_key uuid not null unique,
  verified_at timestamptz,
  raw_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payment_attempts enable row level security;
revoke all on public.payment_attempts from anon, authenticated;
grant select on public.payment_attempts to authenticated;
drop policy if exists payment_attempts_staff_read on public.payment_attempts;
create policy payment_attempts_staff_read on public.payment_attempts
  for select to authenticated using ((select private.is_staff()));

create index if not exists payment_attempts_order_created_idx
  on public.payment_attempts(order_id, created_at desc);

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

  select * into v_setting
  from public.payment_method_settings
  where region_code = case when p_country = 'sri-lanka' then 'LK' else 'AE' end
    and payment_method = p_payment_method
  for share;
  if not found or not v_setting.is_enabled then
    raise exception using errcode = '23514',
      message = 'The selected payment method is unavailable.';
  end if;

  v_base_method := case
    when p_payment_method = 'cash_on_delivery' then 'cod'
    else 'payhere'
  end;
  select * into v_created
  from public.create_storefront_order_with_coupon(
    p_customer, p_country, v_base_method, p_items, p_idempotency_key,
    p_customer_user_id, p_coupon_code
  );
  select * into v_order from public.orders where id = v_created.order_id for update;

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
      select product_id, quantity from public.order_items
      where order_id = v_order.id order by product_id
    loop
      select * into v_product from public.products
      where id = v_item.product_id for update;
      update public.products
      set stock_quantity = v_product.stock_quantity + v_item.quantity
      where id = v_product.id;
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

  update public.orders set
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
  where id = v_order.id returning * into v_order;

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

drop function if exists public.update_payhere_payment(
  text,text,integer,numeric,text
);
drop function if exists public.update_payhere_payment(
  text,text,integer,numeric,text
);
create function public.update_payhere_payment(
  p_order_number text,
  p_provider_payment_id text,
  p_status_code integer,
  p_amount numeric,
  p_currency text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_product public.products%rowtype;
begin
  select * into v_order from public.orders
  where order_number = p_order_number for update;
  if not found or v_order.payment_method <> 'card'
     or v_order.payment_provider <> 'payhere' then
    raise exception using errcode = 'P0002', message = 'Order not found';
  end if;
  if v_order.total_amount <> p_amount or v_order.currency <> p_currency then
    raise exception using errcode = '23514', message = 'Payment amount mismatch';
  end if;
  if v_order.payment_status = 'paid' then return false; end if;

  if p_status_code = 2 then
    for v_item in
      select product_id, quantity from public.order_items
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
        product_id, movement_type, quantity_change, previous_stock,
        new_stock, reference_id
      ) values (
        v_product.id, 'online_order', -v_item.quantity,
        v_product.stock_quantity, v_product.stock_quantity - v_item.quantity,
        v_order.id
      );
    end loop;
  end if;

  update public.orders set
    provider_payment_id = nullif(p_provider_payment_id, ''),
    provider_status_code = p_status_code,
    payment_updated_at = now(),
    payment_status = case p_status_code
      when 2 then 'paid' when 0 then 'processing'
      when -3 then 'refunded' else 'failed' end,
    order_status = case p_status_code
      when 2 then 'confirmed' when 0 then 'pending_payment'
      when -3 then 'refunded' else 'payment_failed' end,
    paid_at = case when p_status_code = 2 then now() else paid_at end,
    confirmed_at = case when p_status_code = 2 then now() else confirmed_at end,
    inventory_finalized_at = case when p_status_code = 2 then now() end
  where id = v_order.id;

  update public.payment_attempts set
    provider_payment_id = nullif(p_provider_payment_id, ''),
    status = case p_status_code
      when 2 then 'paid' when 0 then 'processing'
      when -3 then 'refunded' else 'failed' end,
    verified_at = now(),
    raw_status = p_status_code::text,
    updated_at = now()
  where order_id = v_order.id and provider = 'payhere'
    and status <> 'paid';
  return true;
end;
$$;
revoke all on function public.update_payhere_payment(
  text,text,integer,numeric,text
) from public, anon, authenticated;
grant execute on function public.update_payhere_payment(
  text,text,integer,numeric,text
) to service_role;

create or replace function public.update_admin_order_status(
  p_order_id uuid, p_order_status text, p_payment_status text,
  p_actor_id uuid, p_note text default ''
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_product public.products%rowtype;
begin
  if p_order_status not in (
    'pending','pending_payment','awaiting_bank_transfer','confirmed','paid',
    'processing','packed','shipped','delivered','cancelled','refunded'
  ) then raise exception using errcode = '22023', message = 'Invalid order status.'; end if;
  if p_payment_status not in (
    'unpaid','pending','processing','awaiting_bank_verification',
    'payment_due_on_delivery','paid','failed','cancelled','refunded'
  ) then raise exception using errcode = '22023', message = 'Invalid payment status.'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return false; end if;

  if p_order_status = 'cancelled' and v_order.stock_released_at is null
     and v_order.inventory_finalized_at is not null then
    for v_item in select product_id, quantity from public.order_items
      where order_id = p_order_id order by product_id
    loop
      select * into v_product from public.products
        where id = v_item.product_id for update;
      update public.products
        set stock_quantity = v_product.stock_quantity + v_item.quantity
        where id = v_product.id;
      insert into public.stock_movements(
        product_id,movement_type,quantity_change,previous_stock,new_stock,
        reference_id,created_by
      ) values (
        v_product.id,'manual_adjustment',v_item.quantity,
        v_product.stock_quantity,v_product.stock_quantity + v_item.quantity,
        p_order_id,p_actor_id
      );
    end loop;
  end if;

  update public.orders set
    order_status = p_order_status,
    payment_status = p_payment_status,
    paid_at = case when p_payment_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
    confirmed_at = case when p_order_status in ('confirmed','processing','paid') then coalesce(confirmed_at, now()) else confirmed_at end,
    stock_released_at = case
      when p_order_status = 'cancelled' and inventory_finalized_at is not null
        then coalesce(stock_released_at, now())
      else stock_released_at
    end
  where id = p_order_id;
  insert into public.order_events(
    order_id,from_status,to_status,payment_status,note,actor_id
  ) values (
    p_order_id,v_order.order_status,p_order_status,p_payment_status,
    left(coalesce(p_note,''),1000),p_actor_id
  );
  return true;
end;
$$;
revoke all on function public.update_admin_order_status(
  uuid,text,text,uuid,text
) from public, anon, authenticated;
grant execute on function public.update_admin_order_status(
  uuid,text,text,uuid,text
) to service_role;
