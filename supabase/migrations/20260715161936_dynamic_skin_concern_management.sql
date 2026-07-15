alter table public.skin_concerns
  add column if not exists description text,
  add column if not exists is_active boolean,
  add column if not exists sort_order integer;

update public.skin_concerns
set
  is_active = coalesce(is_active, status = 'active', true),
  sort_order = coalesce(sort_order, 0),
  name = btrim(name),
  slug = lower(btrim(slug));

alter table public.skin_concerns
  alter column is_active set default true,
  alter column is_active set not null,
  alter column sort_order set default 0,
  alter column sort_order set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skin_concerns_name_not_blank'
      and conrelid = 'public.skin_concerns'::regclass
  ) then
    alter table public.skin_concerns
      add constraint skin_concerns_name_not_blank check (char_length(btrim(name)) > 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'skin_concerns_slug_format'
      and conrelid = 'public.skin_concerns'::regclass
  ) then
    alter table public.skin_concerns
      add constraint skin_concerns_slug_format
      check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'skin_concerns_sort_order_nonnegative'
      and conrelid = 'public.skin_concerns'::regclass
  ) then
    alter table public.skin_concerns
      add constraint skin_concerns_sort_order_nonnegative check (sort_order >= 0) not valid;
  end if;
end
$$;

alter table public.skin_concerns validate constraint skin_concerns_name_not_blank;
alter table public.skin_concerns validate constraint skin_concerns_slug_format;
alter table public.skin_concerns validate constraint skin_concerns_sort_order_nonnegative;

create unique index if not exists skin_concerns_name_normalized_key
  on public.skin_concerns (lower(btrim(name)));
create index if not exists skin_concerns_is_active_idx
  on public.skin_concerns (is_active);
create index if not exists skin_concerns_sort_name_idx
  on public.skin_concerns (sort_order, name);

create or replace function public.sync_skin_concern_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  new.slug := lower(btrim(new.slug));

  if tg_op = 'INSERT' then
    new.is_active := coalesce(new.is_active, new.status = 'active', true);
    new.status := case when new.is_active then 'active' else 'inactive' end;
  elsif new.is_active is distinct from old.is_active then
    new.status := case when new.is_active then 'active' else 'inactive' end;
  elsif new.status is distinct from old.status then
    new.is_active := new.status = 'active';
  end if;

  return new;
end;
$$;

drop trigger if exists skin_concerns_sync_fields on public.skin_concerns;
create trigger skin_concerns_sync_fields
before insert or update on public.skin_concerns
for each row execute function public.sync_skin_concern_fields();

revoke all on function public.sync_skin_concern_fields() from public, anon, authenticated;

drop policy if exists "Public view active skin concerns" on public.skin_concerns;
create policy "Public view active skin concerns"
on public.skin_concerns for select to anon
using (is_active);

drop policy if exists "Staff view all skin concerns" on public.skin_concerns;
create policy "Staff view all skin concerns"
on public.skin_concerns for select to authenticated
using (is_active or (select private.is_staff()));

drop policy if exists "Public view active product skin concerns" on public.product_skin_concerns;
create policy "Public view active product skin concerns"
on public.product_skin_concerns for select to anon
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active'
  )
  and exists (
    select 1 from public.skin_concerns sc
    where sc.id = skin_concern_id and sc.is_active
  )
);

drop policy if exists "Staff view product skin concerns" on public.product_skin_concerns;
create policy "Staff view product skin concerns"
on public.product_skin_concerns for select to authenticated
using (
  (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active'
    )
    and exists (
      select 1 from public.skin_concerns sc
      where sc.id = skin_concern_id and sc.is_active
    )
  )
  or (select private.is_staff())
);

create or replace function public.save_admin_skin_concern(
  p_concern_id uuid,
  p_actor_id uuid,
  p_name text,
  p_slug text,
  p_description text,
  p_sort_order integer,
  p_is_active boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_concern_id uuid := coalesce(p_concern_id, gen_random_uuid());
  v_name text := btrim(coalesce(p_name, ''));
  v_slug text := lower(btrim(coalesce(p_slug, '')));
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;
  if v_name = '' then
    raise exception using errcode = '23514', message = 'Skin concern name is required.';
  end if;
  if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception using errcode = '23514', message = 'Enter a valid skin concern slug.';
  end if;
  if coalesce(p_sort_order, 0) < 0 then
    raise exception using errcode = '23514', message = 'Sort order cannot be negative.';
  end if;

  if p_concern_id is null then
    insert into public.skin_concerns (
      id, name, slug, description, sort_order, is_active, status
    ) values (
      v_concern_id, v_name, v_slug, nullif(btrim(p_description), ''),
      coalesce(p_sort_order, 0), coalesce(p_is_active, true),
      case when coalesce(p_is_active, true) then 'active' else 'inactive' end
    );
  else
    update public.skin_concerns set
      name = v_name,
      slug = v_slug,
      description = nullif(btrim(p_description), ''),
      sort_order = coalesce(p_sort_order, 0),
      is_active = coalesce(p_is_active, true),
      status = case when coalesce(p_is_active, true) then 'active' else 'inactive' end
    where id = p_concern_id;
    if not found then
      raise exception using errcode = 'P0002', message = 'Skin concern not found.';
    end if;
  end if;

  return v_concern_id;
end;
$$;

create or replace function public.delete_admin_skin_concern(
  p_concern_id uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_assignment_count integer;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;

  perform 1 from public.skin_concerns where id = p_concern_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Skin concern not found.';
  end if;

  select count(*) into v_assignment_count
  from public.product_skin_concerns
  where skin_concern_id = p_concern_id;
  if v_assignment_count > 0 then
    raise exception using errcode = '23503', message = 'Assigned skin concerns must be deactivated instead of deleted.';
  end if;

  delete from public.skin_concerns where id = p_concern_id;
end;
$$;

revoke all on function public.save_admin_skin_concern(uuid, uuid, text, text, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.save_admin_skin_concern(uuid, uuid, text, text, text, integer, boolean)
  to service_role;

revoke all on function public.delete_admin_skin_concern(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.delete_admin_skin_concern(uuid, uuid)
  to service_role;

grant select on public.skin_concerns, public.product_skin_concerns to anon, authenticated;
revoke insert, update, delete on public.skin_concerns, public.product_skin_concerns from anon, authenticated;
