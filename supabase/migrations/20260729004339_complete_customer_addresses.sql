alter table public.customer_addresses
  add column if not exists address_line_2 text not null default '',
  add column if not exists district_area text not null default '',
  add column if not exists building_details text not null default '',
  add column if not exists landmark text not null default '';

alter table public.customer_addresses drop constraint if exists customer_addresses_address_line_2_check;
alter table public.customer_addresses add constraint customer_addresses_address_line_2_check check (char_length(address_line_2) <= 300);
alter table public.customer_addresses drop constraint if exists customer_addresses_district_area_check;
alter table public.customer_addresses add constraint customer_addresses_district_area_check check (char_length(district_area) <= 160);
alter table public.customer_addresses drop constraint if exists customer_addresses_building_details_check;
alter table public.customer_addresses add constraint customer_addresses_building_details_check check (char_length(building_details) <= 200);
alter table public.customer_addresses drop constraint if exists customer_addresses_landmark_check;
alter table public.customer_addresses add constraint customer_addresses_landmark_check check (char_length(landmark) <= 200);

create or replace function public.set_default_customer_address(p_address_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if not exists (select 1 from public.customer_addresses where id = p_address_id and user_id = v_user_id) then
    raise exception using errcode = 'P0002', message = 'Address not found.';
  end if;
  update public.customer_addresses set is_default = false, updated_at = now()
    where user_id = v_user_id and is_default;
  update public.customer_addresses set is_default = true, updated_at = now()
    where id = p_address_id and user_id = v_user_id;
  return true;
end;
$$;

create or replace function public.delete_customer_address(p_address_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_was_default boolean;
  v_next_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  select is_default into v_was_default from public.customer_addresses
    where id = p_address_id and user_id = v_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Address not found.'; end if;
  delete from public.customer_addresses where id = p_address_id and user_id = v_user_id;
  if v_was_default then
    select id into v_next_id from public.customer_addresses
      where user_id = v_user_id order by updated_at desc, created_at desc limit 1 for update;
    if v_next_id is not null then
      update public.customer_addresses set is_default = true, updated_at = now() where id = v_next_id;
    end if;
  end if;
  return true;
end;
$$;

revoke all on function public.set_default_customer_address(uuid) from public, anon;
revoke all on function public.delete_customer_address(uuid) from public, anon;
grant execute on function public.set_default_customer_address(uuid) to authenticated;
grant execute on function public.delete_customer_address(uuid) to authenticated;
