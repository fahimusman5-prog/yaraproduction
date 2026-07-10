create or replace function public.complete_admin_pos_sale(
  p_payment_method text,
  p_discount numeric,
  p_items jsonb,
  p_currency text,
  p_actor_id uuid
)
returns table (sale_id uuid, sale_number text, total_amount numeric, created_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_sale_id uuid := gen_random_uuid();
  v_sale_number text := 'POS-' || to_char(clock_timestamp() at time zone 'UTC', 'YYYYMMDDHH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_subtotal numeric := 0;
  v_discount numeric := greatest(coalesce(p_discount, 0), 0);
  v_total numeric;
  v_quantity integer;
  v_price numeric;
  v_created_at timestamptz := now();
begin
  if not exists (
    select 1
    from public.profiles
    where id = p_actor_id
      and role in ('admin', 'staff')
  ) then
    raise exception using errcode = '42501', message = 'Staff access required.';
  end if;
  if p_payment_method not in ('cash', 'card', 'bank_transfer') then
    raise exception using errcode = '22023', message = 'Invalid payment method.';
  end if;
  if p_currency not in ('LKR', 'AED') then
    raise exception using errcode = '22023', message = 'Invalid currency.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Sale must contain items.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) order by value->>'product_id'
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity <= 0 then
      raise exception using errcode = '22023', message = 'Invalid quantity.';
    end if;
    select *
    into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
      and status = 'active'
    for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'Product is unavailable.';
    end if;
    if v_product.stock_quantity < v_quantity then
      raise exception using errcode = '23514', message = 'Insufficient stock for ' || v_product.name;
    end if;
    v_price := case when p_currency = 'LKR' then v_product.price_lkr else v_product.price_aed end;
    v_subtotal := v_subtotal + (v_price * v_quantity);
  end loop;

  if v_discount > v_subtotal then
    raise exception using errcode = '23514', message = 'Discount cannot exceed subtotal.';
  end if;
  v_total := v_subtotal - v_discount;

  insert into public.pos_sales (
    id, sale_number, cashier_id, payment_method, subtotal, discount,
    total_amount, currency, created_at
  )
  values (
    v_sale_id, v_sale_number, p_actor_id, p_payment_method, v_subtotal,
    v_discount, v_total, p_currency, v_created_at
  );

  for v_item in select value from jsonb_array_elements(p_items) order by value->>'product_id'
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
    for update;
    v_price := case when p_currency = 'LKR' then v_product.price_lkr else v_product.price_aed end;

    insert into public.pos_sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    values (v_sale_id, v_product.id, v_quantity, v_price, v_price * v_quantity);

    update public.products
    set stock_quantity = v_product.stock_quantity - v_quantity
    where id = v_product.id;

    insert into public.stock_movements (
      product_id, movement_type, quantity_change, previous_stock,
      new_stock, reference_id, created_by
    )
    values (
      v_product.id, 'pos_sale', -v_quantity, v_product.stock_quantity,
      v_product.stock_quantity - v_quantity, v_sale_id, p_actor_id
    );
  end loop;

  return query select v_sale_id, v_sale_number, v_total, v_created_at;
end;
$$;

revoke all on function public.complete_admin_pos_sale(text, numeric, jsonb, text, uuid)
from public, anon, authenticated;
grant execute on function public.complete_admin_pos_sale(text, numeric, jsonb, text, uuid)
to service_role;

notify pgrst, 'reload schema';
