-- Keep the atomic return mutation behind the authenticated server route.
-- The route verifies the user's session before invoking this service-role RPC.

create or replace function public.create_item_return_request(
  p_order_id uuid,
  p_customer_user_id uuid,
  p_customer_email text,
  p_customer_note text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item jsonb;
  v_order_item public.order_items%rowtype;
  v_requested integer;
  v_existing integer;
  v_return_id uuid;
  v_reason text;
begin
  if p_customer_user_id is null then
    raise exception using errcode = '42501', message = 'Customer authentication is required.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 100 then
    raise exception using errcode = '22023', message = 'Select at least one order item.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_order_id::text, 0));
  select * into v_order from public.orders where id = p_order_id for share;
  if not found or v_order.customer_user_id is distinct from p_customer_user_id then
    raise exception using errcode = 'P0002', message = 'Order not found.';
  end if;
  if lower(trim(p_customer_email)) is distinct from lower(v_order.customer_email) then
    raise exception using errcode = '23514', message = 'Customer email does not match the order.';
  end if;
  if v_order.order_status <> 'delivered' or v_order.delivered_at is null then
    raise exception using errcode = '23514', message = 'Returns are available after delivery is recorded.';
  end if;
  if v_order.delivered_at < now() - interval '14 days' then
    raise exception using errcode = '23514', message = 'The 14-day return window has ended.';
  end if;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_requested := (v_item->>'quantity')::integer;
    v_reason := coalesce(v_item->>'reason', '');
    if v_requested <= 0 or v_reason not in ('damaged','defective','incorrect_item','unopened_return','other') then
      raise exception using errcode = '23514', message = 'One or more return item details are invalid.';
    end if;
    select * into v_order_item
    from public.order_items
    where id = (v_item->>'orderItemId')::uuid and order_id = p_order_id
    for share;
    if not found then
      raise exception using errcode = '23514', message = 'One or more return items are invalid.';
    end if;
    select coalesce(sum(ri.quantity), 0)::integer into v_existing
    from public.return_items ri
    join public.return_requests rr on rr.id = ri.return_request_id
    where ri.order_item_id = v_order_item.id
      and rr.status not in ('rejected','cancelled');
    if v_existing + v_requested > v_order_item.quantity then
      raise exception using errcode = '23514', message = 'A return quantity exceeds the remaining eligible quantity.';
    end if;
  end loop;
  insert into public.return_requests(
    order_id, customer_email, customer_user_id, reason, customer_note, status
  ) values (
    p_order_id, lower(v_order.customer_email), p_customer_user_id,
    'item_level', left(coalesce(p_customer_note, ''), 2000), 'requested'
  ) returning id into v_return_id;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.return_items(
      return_request_id, order_item_id, quantity, reason, customer_note
    ) values (
      v_return_id, (v_item->>'orderItemId')::uuid,
      (v_item->>'quantity')::integer, v_item->>'reason',
      left(coalesce(v_item->>'note', ''), 1000)
    );
  end loop;
  insert into public.return_status_history(
    return_request_id, from_status, to_status, note, actor_id
  ) values (
    v_return_id, null, 'requested',
    'Customer submitted an item-level return request.', p_customer_user_id
  );
  return v_return_id;
end;
$$;

revoke all on function public.create_item_return_request(uuid, uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_item_return_request(uuid, uuid, text, text, jsonb)
  to service_role;
