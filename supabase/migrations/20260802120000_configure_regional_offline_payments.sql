-- Configure launch payment availability without removing historical payment
-- method values from orders. Only validated, region-specific bank settings are
-- exposed by the payment-methods API.

alter table public.payment_method_settings
  add column if not exists iban text;

-- Card and Koko remain provider-controlled and hidden until deliberately
-- configured. MintPay is retired from all new checkout use.
update public.payment_method_settings
set is_enabled = false,
    updated_at = now()
where payment_method in ('card', 'koko', 'mintpay');

-- Sri Lankan bank transfer is the only bank account supplied for launch.
update public.payment_method_settings
set currency = 'LKR',
    provider_name = null,
    processing_fee_percent = 0,
    is_enabled = true,
    account_holder_name = 'Yara International Trading Pvt Ltd',
    bank_name = 'Nations Trust Bank',
    branch_name = 'Peradeniya Branch',
    account_number = '200260069070',
    iban = null,
    swift_code = null,
    instructions = 'Transfer the exact order total to the account below and use your order number as the payment reference.',
    updated_at = now()
where region_code = 'LK'
  and payment_method = 'bank_transfer';

-- COD is available in both regions and carries no processing fee.
update public.payment_method_settings
set processing_fee_percent = 0,
    is_enabled = true,
    updated_at = now()
where payment_method = 'cash_on_delivery';

-- Do not expose an incomplete UAE account. Preserve any complete, previously
-- configured account for admin verification, but keep it disabled until its
-- IBAN and SWIFT/BIC are present.
update public.payment_method_settings
set is_enabled = false,
    updated_at = now()
where region_code = 'AE'
  and payment_method = 'bank_transfer'
  and (
    nullif(trim(coalesce(account_holder_name, '')), '') is null
    or nullif(trim(coalesce(bank_name, '')), '') is null
    or nullif(trim(coalesce(account_number, '')), '') is null
    or nullif(trim(coalesce(iban, '')), '') is null
    or nullif(trim(coalesce(swift_code, '')), '') is null
  );
