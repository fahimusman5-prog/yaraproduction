-- Admin datetime-local inputs are entered in Asia/Colombo. Repair the
-- affected rows that were previously persisted as if the input were UTC.
-- The exact-value guards make this migration a no-op after the live repair
-- has already been applied and avoid touching unrelated coupons.
update public.coupons
set starts_at = starts_at - interval '5 hours 30 minutes',
    ends_at = ends_at - interval '5 hours 30 minutes',
    updated_at = now()
where created_by is not null
  and (
    (code = 'YARAUAE'
      and starts_at = timestamptz '2026-09-11 17:40:00+00'
      and ends_at = timestamptz '2026-09-19 17:44:00+00')
    or (code = 'YARALK'
      and starts_at = timestamptz '2026-09-11 17:40:00+00'
      and ends_at = timestamptz '2026-09-19 17:43:00+00')
    or (code = 'UAEFREE0'
      and starts_at = timestamptz '2026-09-11 17:38:00+00'
      and ends_at = timestamptz '2026-09-19 00:00:00+00')
    or (code = 'LKFREE0'
      and starts_at = timestamptz '2026-09-11 17:37:00+00'
      and ends_at = timestamptz '2026-09-19 12:00:00+00')
    or (code = 'LKFREE'
      and starts_at = timestamptz '2026-09-12 00:00:00+00'
      and ends_at = timestamptz '2026-09-19 00:00:00+00')
  );
