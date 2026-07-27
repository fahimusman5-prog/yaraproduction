-- Additive launch-readiness controls for order lifecycle auditing and cancellation safety.
alter table public.orders drop constraint if exists orders_order_status_check;
alter table public.orders add constraint orders_order_status_check
  check (order_status = any (array['pending','paid','processing','packed','shipped','delivered','cancelled','refunded']));

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  payment_status text,
  note text not null default '',
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_created_idx on public.order_events(order_id, created_at desc);
alter table public.order_events enable row level security;
drop policy if exists order_events_staff_select on public.order_events;
create policy order_events_staff_select on public.order_events for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));
drop policy if exists order_events_staff_insert on public.order_events;
create policy order_events_staff_insert on public.order_events for insert to authenticated with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')));

create or replace function public.update_admin_order_status(p_order_id uuid, p_order_status text, p_payment_status text, p_actor_id uuid, p_note text default '') returns boolean
language plpgsql security definer set search_path to '' as $function$
declare v_order public.orders%rowtype; v_item record; v_product public.products%rowtype;
begin
  if not exists (select 1 from public.profiles where id = p_actor_id and role in ('admin','staff')) then raise exception using errcode = '42501', message = 'Staff access required.'; end if;
  if p_order_status not in ('pending','paid','processing','packed','shipped','delivered','cancelled','refunded') then raise exception using errcode = '22023', message = 'Invalid order status.'; end if;
  if p_payment_status not in ('pending','paid','failed','refunded') then raise exception using errcode = '22023', message = 'Invalid payment status.'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Order not found.'; end if;
  if v_order.order_status = 'delivered' and p_order_status not in ('delivered','refunded') then raise exception using errcode = '23514', message = 'Delivered orders cannot move backwards.'; end if;
  if v_order.order_status = 'cancelled' and p_order_status <> 'cancelled' then raise exception using errcode = '23514', message = 'Cancelled orders cannot be reopened.'; end if;
  update public.orders set order_status = p_order_status, payment_status = p_payment_status where id = p_order_id;
  if p_order_status = 'cancelled' and v_order.stock_released_at is null then
    for v_item in select product_id, quantity from public.order_items where order_id = p_order_id order by product_id loop
      select * into v_product from public.products where id = v_item.product_id for update;
      if not found then raise exception using errcode = 'P0002', message = 'Order product not found.'; end if;
      update public.products set stock_quantity = v_product.stock_quantity + v_item.quantity where id = v_product.id;
      insert into public.stock_movements(product_id, movement_type, quantity_change, previous_stock, new_stock, reference_id, created_by) values (v_product.id, 'manual_adjustment', v_item.quantity, v_product.stock_quantity, v_product.stock_quantity + v_item.quantity, p_order_id, p_actor_id);
    end loop;
    update public.orders set stock_released_at = now() where id = p_order_id;
  end if;
  insert into public.order_events(order_id, from_status, to_status, payment_status, note, actor_id) values (p_order_id, v_order.order_status, p_order_status, p_payment_status, left(coalesce(p_note, ''), 1000), p_actor_id);
  return true;
end;
$function$;
revoke all on function public.update_admin_order_status(uuid, text, text, uuid, text) from public;
grant execute on function public.update_admin_order_status(uuid, text, text, uuid, text) to service_role;
