-- Keep approved rate history and resolve the newest currently effective row.

alter table public.exchange_rates
  alter column expires_at drop not null;

alter table public.exchange_rates
  drop constraint if exists exchange_rates_check;

alter table public.exchange_rates
  add constraint exchange_rates_check
  check (expires_at is null or expires_at > effective_from);

drop index if exists public.exchange_rates_one_active_aed_lkr_idx;

create index if not exists exchange_rates_aed_lkr_resolution_idx
  on public.exchange_rates(source_currency, target_currency, active, effective_from desc, created_at desc);

create or replace function public.save_aed_lkr_exchange_rate(
  p_rate numeric,
  p_effective_from timestamptz,
  p_expires_at timestamptz,
  p_updated_by uuid
)
returns public.exchange_rates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saved public.exchange_rates;
begin
  if p_rate is null or p_rate <= 0 or p_rate > 1000 then
    raise exception using errcode = '22023', message = 'Rate must be greater than 0 and no more than 1000.';
  end if;
  if p_effective_from is null then
    raise exception using errcode = '22023', message = 'Effective time is required.';
  end if;
  if p_expires_at is not null and p_expires_at <= p_effective_from then
    raise exception using errcode = '22023', message = 'Expiry must be after the effective time.';
  end if;
  insert into public.exchange_rates (
    source_currency, target_currency, rate, effective_from, expires_at,
    active, rate_source, updated_by
  ) values (
    'AED', 'LKR', p_rate, p_effective_from, p_expires_at,
    true, 'admin-approved', p_updated_by
  )
  returning * into v_saved;
  return v_saved;
end;
$$;

revoke all on function public.save_aed_lkr_exchange_rate(numeric, timestamptz, timestamptz, uuid)
  from public, anon, authenticated;
grant execute on function public.save_aed_lkr_exchange_rate(numeric, timestamptz, timestamptz, uuid)
  to service_role;
