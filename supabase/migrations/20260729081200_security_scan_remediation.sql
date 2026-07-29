-- Confirmed non-payment security findings from the formal repository scan.

create table if not exists public.api_rate_limit_buckets (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0),
  primary key (scope, key_hash)
);
alter table public.api_rate_limit_buckets enable row level security;
revoke all on public.api_rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on public.api_rate_limit_buckets to service_role;

create or replace function public.consume_api_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_bucket public.api_rate_limit_buckets%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if
    p_scope !~ '^[a-z0-9-]{1,80}$'
    or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_limit < 1
    or p_limit > 10000
    or p_window_seconds < 1
    or p_window_seconds > 86400
  then
    raise exception using errcode = '22023', message = 'Invalid rate-limit request.';
  end if;

  insert into public.api_rate_limit_buckets (
    scope,
    key_hash,
    window_started_at,
    attempts
  ) values (
    p_scope,
    p_key_hash,
    v_now,
    1
  )
  on conflict (scope, key_hash) do update
  set
    window_started_at = case
      when public.api_rate_limit_buckets.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
      then v_now
      else public.api_rate_limit_buckets.window_started_at
    end,
    attempts = case
      when public.api_rate_limit_buckets.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
      then 1
      else public.api_rate_limit_buckets.attempts + 1
    end
  returning * into v_bucket;

  return v_bucket.attempts <= p_limit;
end;
$function$;
revoke all on function public.consume_api_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer)
  to service_role;

-- Direct Data API writes are not an administration boundary. All administrative
-- mutations pass through server-authorized service-role actions and RPCs.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'shipping_zones',
    'shipping_methods',
    'coupons',
    'coupon_products',
    'coupon_categories',
    'coupon_redemptions',
    'return_requests',
    'return_items',
    'return_images',
    'exchange_items',
    'return_status_history',
    'refunds',
    'refund_items',
    'refund_status_history'
  ]
  loop
    execute format(
      'drop policy if exists staff_manage_%1$s on public.%1$I',
      v_table
    );
    execute format(
      'drop policy if exists staff_read_%1$s on public.%1$I',
      v_table
    );
    execute format(
      'create policy staff_read_%1$s on public.%1$I for select to authenticated using ((select private.is_staff()))',
      v_table
    );
    execute format(
      'revoke insert, update, delete on public.%I from authenticated',
      v_table
    );
    execute format('grant select on public.%I to authenticated', v_table);
  end loop;
end $$;

drop policy if exists order_events_staff_insert on public.order_events;
revoke insert, update, delete on public.order_events from authenticated;

-- Return evidence is uploaded only by the bounded authenticated server route.
-- The service key bypasses RLS; browser clients retain only owner-read access.
drop policy if exists return_evidence_customer_insert on storage.objects;
drop policy if exists return_evidence_customer_delete on storage.objects;

create or replace function public.update_admin_order_status(
  p_order_id uuid,
  p_order_status text,
  p_payment_status text,
  p_actor_id uuid,
  p_note text default ''
) returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_product public.products%rowtype;
  v_actor_role text;
begin
  select role into v_actor_role
  from public.profiles
  where id = p_actor_id;
  if v_actor_role not in ('admin', 'staff') then
    raise exception using errcode = '42501', message = 'Staff access required.';
  end if;
  if p_order_status not in (
    'pending', 'paid', 'processing', 'packed', 'shipped', 'delivered',
    'cancelled', 'refunded'
  ) then
    raise exception using errcode = '22023', message = 'Invalid order status.';
  end if;
  if p_payment_status not in ('pending', 'paid', 'failed', 'refunded') then
    raise exception using errcode = '22023', message = 'Invalid payment status.';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Order not found.';
  end if;
  if
    v_actor_role <> 'admin'
    and (
      p_payment_status <> v_order.payment_status
      or p_order_status in ('paid', 'refunded')
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Administrator access required for financial status changes.';
  end if;
  if
    v_order.order_status = 'delivered'
    and p_order_status not in ('delivered', 'refunded')
  then
    raise exception using
      errcode = '23514',
      message = 'Delivered orders cannot move backwards.';
  end if;
  if
    v_order.order_status = 'cancelled'
    and p_order_status <> 'cancelled'
  then
    raise exception using
      errcode = '23514',
      message = 'Cancelled orders cannot be reopened.';
  end if;

  update public.orders
  set order_status = p_order_status, payment_status = p_payment_status
  where id = p_order_id;

  if p_order_status = 'cancelled' and v_order.stock_released_at is null then
    for v_item in
      select product_id, quantity
      from public.order_items
      where order_id = p_order_id
      order by product_id
    loop
      select * into v_product
      from public.products
      where id = v_item.product_id
      for update;
      if not found then
        raise exception using
          errcode = 'P0002',
          message = 'Order product not found.';
      end if;
      update public.products
      set stock_quantity = v_product.stock_quantity + v_item.quantity
      where id = v_product.id;
      insert into public.stock_movements (
        product_id,
        movement_type,
        quantity_change,
        previous_stock,
        new_stock,
        reference_id,
        created_by
      ) values (
        v_product.id,
        'manual_adjustment',
        v_item.quantity,
        v_product.stock_quantity,
        v_product.stock_quantity + v_item.quantity,
        p_order_id,
        p_actor_id
      );
    end loop;
    update public.orders
    set stock_released_at = now()
    where id = p_order_id;
  end if;

  insert into public.order_events (
    order_id,
    from_status,
    to_status,
    payment_status,
    note,
    actor_id
  ) values (
    p_order_id,
    v_order.order_status,
    p_order_status,
    p_payment_status,
    left(coalesce(p_note, ''), 1000),
    p_actor_id
  );
  return true;
end;
$function$;
revoke all on function public.update_admin_order_status(
  uuid, text, text, uuid, text
) from public, anon, authenticated;
grant execute on function public.update_admin_order_status(
  uuid, text, text, uuid, text
) to service_role;

create or replace function public.record_general_refund(
  p_order_id uuid,
  p_return_request_id uuid,
  p_amount numeric,
  p_refund_type text,
  p_reason text,
  p_internal_note text,
  p_actor_id uuid
) returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_order public.orders%rowtype;
  v_refund_id uuid;
  v_already_refunded numeric;
begin
  if not exists (
    select 1
    from public.profiles
    where id = p_actor_id and role = 'admin'
  ) then
    raise exception using
      errcode = '42501',
      message = 'Administrator access required.';
  end if;
  if p_amount <= 0 or p_refund_type not in ('full', 'partial') then
    raise exception using errcode = '22023', message = 'Invalid refund.';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception using errcode = '22023', message = 'Refund reason required.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_order_id::text, 0));
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Order not found.';
  end if;
  if v_order.payment_status <> 'paid' then
    raise exception using
      errcode = '23514',
      message = 'Refunds can only be recorded against a paid order.';
  end if;

  select coalesce(sum(amount), 0)
  into v_already_refunded
  from public.refunds
  where order_id = p_order_id
    and status not in ('rejected', 'failed');
  if v_already_refunded + p_amount > v_order.total_amount then
    raise exception using
      errcode = '23514',
      message = 'Refunds cannot exceed the paid order total.';
  end if;

  insert into public.refunds (
    order_id,
    return_request_id,
    amount,
    currency,
    refund_type,
    status,
    reason,
    internal_note,
    actor_id
  ) values (
    p_order_id,
    p_return_request_id,
    round(p_amount, 2),
    v_order.currency,
    p_refund_type,
    'requested',
    left(trim(p_reason), 1000),
    left(coalesce(p_internal_note, ''), 2000),
    p_actor_id
  )
  returning id into v_refund_id;
  return v_refund_id;
end;
$function$;
revoke all on function public.record_general_refund(
  uuid, uuid, numeric, text, text, text, uuid
) from public, anon, authenticated;
grant execute on function public.record_general_refund(
  uuid, uuid, numeric, text, text, text, uuid
) to service_role;
