-- MintPay is no longer an offered checkout method. Keep historical order
-- values valid, but prevent the retired settings from being enabled.
update public.payment_method_settings
set is_enabled = false,
    updated_at = now()
where payment_method = 'mintpay'
  and is_enabled = true;
