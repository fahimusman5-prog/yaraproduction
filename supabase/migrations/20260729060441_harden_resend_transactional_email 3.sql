alter table public.notification_events
  drop constraint if exists notification_events_status_check;

alter table public.notification_events
  add constraint notification_events_status_check
  check (status in ('pending', 'retrying', 'sent', 'failed', 'skipped'));

alter table public.notification_events
  add column if not exists provider text not null default 'resend',
  add column if not exists notification_type text,
  add column if not exists dedupe_key text,
  add column if not exists error_category text,
  add column if not exists first_attempt_at timestamptz,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists failed_at timestamptz;

update public.notification_events
set
  notification_type = coalesce(notification_type, template),
  dedupe_key = coalesce(
    dedupe_key,
    case
      when order_id is not null
        then template || ':' || order_id::text || ':' || lower(recipient)
      else template || ':' || id::text
    end
  )
where notification_type is null or dedupe_key is null;

alter table public.notification_events
  alter column notification_type set not null,
  alter column dedupe_key set not null;

drop index if exists public.notification_events_dedupe_key;
create unique index notification_events_dedupe_key
  on public.notification_events(dedupe_key);
create index if not exists notification_events_retry_due_idx
  on public.notification_events(next_attempt_at)
  where status = 'retrying' and next_attempt_at is not null;

create table if not exists public.notification_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  notification_event_id uuid not null
    references public.notification_events(id) on delete cascade,
  attempt_number integer not null check (attempt_number between 1 and 10),
  provider text not null check (provider = 'resend'),
  status text not null check (status in ('sent', 'failed')),
  provider_message_id text,
  error_category text check (
    error_category is null or error_category in (
      'invalid_recipient',
      'invalid_sender',
      'authentication',
      'rate_limit',
      'provider_temporary',
      'provider_permanent',
      'network'
    )
  ),
  attempted_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (notification_event_id, attempt_number)
);

create index if not exists notification_delivery_attempts_event_idx
  on public.notification_delivery_attempts(notification_event_id, attempt_number);
create index if not exists notification_delivery_attempts_provider_message_idx
  on public.notification_delivery_attempts(provider_message_id)
  where provider_message_id is not null;

alter table public.notification_delivery_attempts enable row level security;
drop policy if exists notification_delivery_attempts_staff_select
  on public.notification_delivery_attempts;
create policy notification_delivery_attempts_staff_select
  on public.notification_delivery_attempts
  for select
  to authenticated
  using ((select private.is_staff()));

revoke all on public.notification_delivery_attempts from anon, authenticated;
grant select on public.notification_delivery_attempts to authenticated;
revoke insert, update, delete on public.notification_events
  from anon, authenticated;
