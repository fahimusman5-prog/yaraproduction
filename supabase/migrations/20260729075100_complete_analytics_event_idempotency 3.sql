alter table public.analytics_events
  add column if not exists event_id uuid;

update public.analytics_events
set event_id = gen_random_uuid()
where event_id is null;

alter table public.analytics_events
  alter column event_id set not null;

create unique index if not exists analytics_events_event_id_key
  on public.analytics_events(event_id);

create index if not exists analytics_events_reporting_idx
  on public.analytics_events(event_name, created_at desc);
