create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = btrim(email)),
  normalized_email text not null unique check (normalized_email = lower(btrim(email))),
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  source text not null default 'website_footer',
  locale text,
  country text,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index newsletter_subscribers_status_subscribed_at_idx
  on public.newsletter_subscribers(status, subscribed_at desc);
create index newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers(created_at desc);

alter table public.newsletter_subscribers enable row level security;

-- The public route writes with the server-only secret key. Browser clients get
-- no insert policy, so they cannot submit directly to the Data API.
create policy "Newsletter subscribers are readable by admins"
  on public.newsletter_subscribers for select to authenticated
  using ((select private.is_admin()));
create policy "Newsletter subscribers are manageable by admins"
  on public.newsletter_subscribers for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create trigger newsletter_subscribers_set_updated_at
before update on public.newsletter_subscribers
for each row execute procedure private.set_updated_at();
