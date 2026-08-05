-- Reporting foundations: keep the report page fast without changing checkout semantics.
create index if not exists orders_reports_created_idx
  on public.orders (created_at desc, order_status, payment_status);
create index if not exists orders_reports_customer_idx
  on public.orders (customer_user_id, created_at desc);
create index if not exists orders_reports_region_idx
  on public.orders (region_code, currency, created_at desc);
create index if not exists order_items_reports_order_idx
  on public.order_items (order_id, product_id);

create table if not exists public.report_export_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  export_scope text not null check (export_scope in ('current_filter', 'selected_orders', 'all_orders')),
  format text not null check (format in ('xlsx', 'csv', 'pdf', 'json')),
  filter_payload jsonb not null default '{}'::jsonb,
  row_count integer not null default 0 check (row_count >= 0),
  created_at timestamptz not null default now()
);
alter table public.report_export_events enable row level security;
revoke all on public.report_export_events from anon, authenticated;
drop policy if exists report_export_events_admin_select on public.report_export_events;
create policy report_export_events_admin_select on public.report_export_events
  for select to authenticated using ((select private.is_admin()));
grant select on public.report_export_events to authenticated;
create index if not exists report_export_events_actor_created_idx
  on public.report_export_events(actor_id, created_at desc);

create or replace function public.log_report_export(
  p_scope text, p_format text, p_filters jsonb, p_row_count integer
) returns uuid
language plpgsql security invoker set search_path = public, private
as $$
declare v_id uuid;
begin
  if not (select private.is_admin()) then raise exception using errcode = '42501', message = 'Admin access required.'; end if;
  insert into public.report_export_events(actor_id, export_scope, format, filter_payload, row_count)
  values (auth.uid(), p_scope, p_format, coalesce(p_filters, '{}'::jsonb), greatest(coalesce(p_row_count, 0), 0))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.log_report_export(text, text, jsonb, integer) from public, anon;
grant execute on function public.log_report_export(text, text, jsonb, integer) to authenticated;
