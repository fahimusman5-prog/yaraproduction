create index if not exists exchange_rates_updated_by_idx
  on public.exchange_rates(updated_by);

create index if not exists payment_attempts_exchange_rate_id_idx
  on public.payment_attempts(exchange_rate_id);
