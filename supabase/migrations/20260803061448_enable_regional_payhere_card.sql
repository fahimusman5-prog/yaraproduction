-- Enable the canonical PayHere card method in both regions. Runtime
-- credentials and the UAE active rate still gate customer availability.
update public.payment_method_settings
set is_enabled = true,
    provider_name = 'payhere',
    updated_at = now()
where payment_method = 'card'
  and region_code in ('LK', 'AE');
