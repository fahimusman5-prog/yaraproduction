-- Private return evidence and immutable item-level return/refund accounting.

alter table public.order_items
  add column if not exists returned_quantity integer not null default 0,
  add column if not exists refunded_quantity integer not null default 0;

alter table public.order_items drop constraint if exists order_items_returned_quantity_check;
alter table public.order_items add constraint order_items_returned_quantity_check
  check (returned_quantity >= 0 and returned_quantity <= quantity);
alter table public.order_items drop constraint if exists order_items_refunded_quantity_check;
alter table public.order_items add constraint order_items_refunded_quantity_check
  check (refunded_quantity >= 0 and refunded_quantity <= quantity);

alter table public.return_items
  add column if not exists reason text not null default 'other',
  add column if not exists customer_note text not null default '',
  add column if not exists approved_quantity integer not null default 0,
  add column if not exists rejected_quantity integer not null default 0,
  add column if not exists received_quantity integer not null default 0,
  add column if not exists inspection_outcome text not null default '',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

alter table public.return_items drop constraint if exists return_items_decision_quantity_check;
alter table public.return_items add constraint return_items_decision_quantity_check
  check (
    approved_quantity >= 0
    and rejected_quantity >= 0
    and received_quantity >= 0
    and approved_quantity + rejected_quantity <= quantity
    and received_quantity <= approved_quantity
  );

alter table public.return_images
  add column if not exists original_filename text not null default '',
  add column if not exists content_type text not null default '',
  add column if not exists size_bytes bigint not null default 0,
  add column if not exists uploaded_by uuid references public.profiles(id) on delete set null;

alter table public.return_images drop constraint if exists return_images_size_check;
alter table public.return_images add constraint return_images_size_check
  check (size_bytes >= 0 and size_bytes <= 5242880);
alter table public.return_images drop constraint if exists return_images_content_type_check;
alter table public.return_images add constraint return_images_content_type_check
  check (
    content_type in ('image/jpeg','image/png','image/webp')
    or (content_type = '' and size_bytes = 0)
  );

alter table public.refund_items
  add column if not exists product_amount numeric(12,2) not null default 0,
  add column if not exists discount_allocation numeric(12,2) not null default 0,
  add column if not exists shipping_allocation numeric(12,2) not null default 0,
  add column if not exists tax_allocation numeric(12,2) not null default 0;

update public.refund_items
set product_amount = amount,
    discount_allocation = 0,
    shipping_allocation = 0,
    tax_allocation = 0
where product_amount = 0
  and discount_allocation = 0
  and shipping_allocation = 0
  and tax_allocation = 0;

alter table public.refund_items drop constraint if exists refund_items_allocations_check;
alter table public.refund_items add constraint refund_items_allocations_check
  check (
    product_amount >= 0 and discount_allocation >= 0
    and shipping_allocation >= 0 and tax_allocation >= 0
    and amount = product_amount - discount_allocation + shipping_allocation + tax_allocation
  );

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'return-evidence',
  'return-evidence',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists return_evidence_customer_select on storage.objects;
create policy return_evidence_customer_select on storage.objects
for select to authenticated
using (
  bucket_id = 'return-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists return_evidence_customer_insert on storage.objects;
create policy return_evidence_customer_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'return-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists return_evidence_customer_delete on storage.objects;
create policy return_evidence_customer_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'return-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists return_evidence_staff_select on storage.objects;
create policy return_evidence_staff_select on storage.objects
for select to authenticated
using (bucket_id = 'return-evidence' and (select private.is_staff()));
drop policy if exists return_evidence_staff_delete on storage.objects;
create policy return_evidence_staff_delete on storage.objects
for delete to authenticated
using (bucket_id = 'return-evidence' and (select private.is_staff()));

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
  if p_customer_user_id is null or p_customer_user_id is distinct from (select auth.uid()) then
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
      v_return_id,
      (v_item->>'orderItemId')::uuid,
      (v_item->>'quantity')::integer,
      v_item->>'reason',
      left(coalesce(v_item->>'note', ''), 1000)
    );
  end loop;
  insert into public.return_status_history(
    return_request_id, from_status, to_status, note, actor_id
  ) values (
    v_return_id, null, 'requested', 'Customer submitted an item-level return request.',
    p_customer_user_id
  );
  return v_return_id;
end;
$$;

revoke all on function public.create_item_return_request(uuid, uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_item_return_request(uuid, uuid, text, text, jsonb)
  to authenticated;

create or replace function public.review_return_request_items(
  p_return_request_id uuid,
  p_actor_id uuid,
  p_admin_note text,
  p_items jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_return_item public.return_items%rowtype;
  v_approved integer;
  v_rejected integer;
  v_total_approved integer;
  v_total_requested integer;
  v_next_status text;
  v_previous_status text;
begin
  if not exists (
    select 1 from public.profiles where id = p_actor_id and role in ('admin','staff')
  ) then
    raise exception using errcode = '42501', message = 'Staff access required.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_return_request_id::text, 0));
  select status into v_previous_status
  from public.return_requests where id = p_return_request_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Return request not found.';
  end if;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_return_item from public.return_items
    where id = (v_item->>'returnItemId')::uuid
      and return_request_id = p_return_request_id for update;
    if not found then
      raise exception using errcode = '23514', message = 'Return item not found.';
    end if;
    v_approved := (v_item->>'approvedQuantity')::integer;
    v_rejected := (v_item->>'rejectedQuantity')::integer;
    if v_approved < 0 or v_rejected < 0
       or v_approved + v_rejected <> v_return_item.quantity then
      raise exception using errcode = '23514',
        message = 'Every requested quantity must be approved or rejected.';
    end if;
    update public.return_items set
      approved_quantity = v_approved,
      rejected_quantity = v_rejected,
      inspection_outcome = left(coalesce(v_item->>'inspectionOutcome', ''), 1000),
      reviewed_at = now(),
      reviewed_by = p_actor_id
    where id = v_return_item.id;
  end loop;
  select coalesce(sum(approved_quantity),0), coalesce(sum(quantity),0)
    into v_total_approved, v_total_requested
  from public.return_items where return_request_id = p_return_request_id;
  v_next_status := case
    when v_total_approved = 0 then 'rejected'
    when v_total_approved = v_total_requested then 'approved'
    else 'approved'
  end;
  update public.return_requests set
    status = v_next_status,
    admin_note = left(coalesce(p_admin_note, ''), 2000),
    approved_at = case when v_next_status = 'approved' then now() else approved_at end,
    updated_at = now()
  where id = p_return_request_id;
  insert into public.return_status_history(
    return_request_id, from_status, to_status, note, actor_id
  ) values (
    p_return_request_id, v_previous_status, v_next_status,
    left(coalesce(p_admin_note, ''), 2000), p_actor_id
  );
  return v_next_status;
end;
$$;

revoke all on function public.review_return_request_items(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.review_return_request_items(uuid, uuid, text, jsonb)
  to service_role;

create or replace function public.mark_return_items_received(
  p_return_request_id uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.return_items%rowtype;
  v_delta integer;
begin
  if not exists (
    select 1 from public.profiles where id = p_actor_id and role in ('admin','staff')
  ) then
    raise exception using errcode = '42501', message = 'Staff access required.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_return_request_id::text, 0));
  for v_item in
    select * from public.return_items
    where return_request_id = p_return_request_id for update
  loop
    v_delta := v_item.approved_quantity - v_item.received_quantity;
    if v_delta < 0 then
      raise exception using errcode = '23514', message = 'Received return quantity is invalid.';
    end if;
    if v_delta > 0 then
      update public.order_items
      set returned_quantity = returned_quantity + v_delta
      where id = v_item.order_item_id
        and returned_quantity + v_delta <= quantity;
      if not found then
        raise exception using errcode = '23514', message = 'Returned quantity exceeds the ordered quantity.';
      end if;
      update public.return_items
      set received_quantity = approved_quantity, reviewed_by = p_actor_id
      where id = v_item.id;
    end if;
  end loop;
end;
$$;

revoke all on function public.mark_return_items_received(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.mark_return_items_received(uuid, uuid)
  to service_role;

create or replace function public.record_item_refund(
  p_order_id uuid,
  p_return_request_id uuid,
  p_actor_id uuid,
  p_reason text,
  p_internal_note text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_order_item public.order_items%rowtype;
  v_return_item public.return_items%rowtype;
  v_item jsonb;
  v_quantity integer;
  v_product_amount numeric(12,2);
  v_discount numeric(12,2);
  v_shipping numeric(12,2);
  v_amount numeric(12,2);
  v_total numeric(12,2) := 0;
  v_refund_id uuid;
  v_return_refunded integer;
  v_return_item_found boolean;
begin
  if not exists (select 1 from public.profiles where id = p_actor_id and role = 'admin') then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_order_id::text, 0));
  select * into v_order from public.orders where id = p_order_id for share;
  if not found or v_order.payment_status <> 'paid' then
    raise exception using errcode = '23514', message = 'Refunds require a paid order.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Select at least one refundable item.';
  end if;
  insert into public.refunds(
    order_id, return_request_id, amount, currency, refund_type, status,
    reason, internal_note, actor_id
  ) values (
    p_order_id, p_return_request_id, 0.01, v_order.currency, 'partial', 'requested',
    left(p_reason,1000), left(coalesce(p_internal_note,''),2000), p_actor_id
  ) returning id into v_refund_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_order_item from public.order_items
    where id = (v_item->>'orderItemId')::uuid and order_id = p_order_id for update;
    if not found or v_quantity <= 0
       or v_order_item.refunded_quantity + v_quantity > v_order_item.quantity then
      raise exception using errcode = '23514', message = 'Refund quantity exceeds the eligible order quantity.';
    end if;
    if p_return_request_id is not null then
      select * into v_return_item from public.return_items
      where return_request_id = p_return_request_id
        and order_item_id = v_order_item.id for share;
      v_return_item_found := found;
      select coalesce(sum(fi.quantity), 0)::integer into v_return_refunded
      from public.refund_items fi
      join public.refunds f on f.id = fi.refund_id
      where f.return_request_id = p_return_request_id
        and fi.order_item_id = v_order_item.id
        and f.status not in ('rejected','failed');
      if not v_return_item_found
         or v_return_refunded + v_quantity > v_return_item.approved_quantity then
        raise exception using errcode = '23514', message = 'Refund quantity exceeds the approved return quantity.';
      end if;
    end if;
    v_product_amount := round(v_order_item.unit_price * v_quantity, 2);
    v_discount := case when v_order.subtotal_amount > 0
      then round(v_order.discount_amount * (v_product_amount / v_order.subtotal_amount), 2)
      else 0 end;
    v_shipping := case when coalesce((v_item->>'includeShipping')::boolean, false)
      then round(v_order_item.shipping_fee * (v_quantity::numeric / v_order_item.quantity), 2)
      else 0 end;
    v_amount := v_product_amount - v_discount + v_shipping;
    if v_amount < 0 then
      raise exception using errcode = '23514', message = 'Refund allocation is invalid.';
    end if;
    insert into public.refund_items(
      refund_id, order_item_id, quantity, amount, product_amount,
      discount_allocation, shipping_allocation, tax_allocation
    ) values (
      v_refund_id, v_order_item.id, v_quantity, v_amount, v_product_amount,
      v_discount, v_shipping, 0
    );
    update public.order_items set
      refunded_quantity = refunded_quantity + v_quantity
    where id = v_order_item.id;
    v_total := v_total + v_amount;
  end loop;
  if v_total <= 0 or v_total > v_order.total_amount then
    raise exception using errcode = '23514', message = 'Refund amount exceeds the eligible paid amount.';
  end if;
  update public.refunds set amount = v_total where id = v_refund_id;
  insert into public.refund_status_history(
    refund_id, from_status, to_status, note, actor_id
  ) values (
    v_refund_id, null, 'requested',
    'Item-level refund record created. No provider refund was issued.', p_actor_id
  );
  return v_refund_id;
end;
$$;

revoke all on function public.record_item_refund(uuid, uuid, uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_item_refund(uuid, uuid, uuid, text, text, jsonb)
  to service_role;
