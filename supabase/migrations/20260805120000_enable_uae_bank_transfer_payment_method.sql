-- Keep UAE bank transfer configuration durable if the original row is absent,
-- while leaving the established Sri Lankan account untouched.
insert into public.payment_method_settings (
  region_code,
  currency,
  payment_method,
  provider_name,
  processing_fee_percent,
  is_enabled,
  account_holder_name,
  bank_name,
  branch_name,
  account_number,
  iban,
  swift_code,
  instructions,
  updated_at
)
values (
  'AE',
  'AED',
  'bank_transfer',
  null,
  0,
  true,
  'FATHIMA FAZEENA FAROOK',
  'Mashreq Bank',
  null,
  '019101283587',
  'AE660330000019101283587',
  null,
  'Complete your payment securely using the bank account details below. Please use your Order ID as the payment reference whenever possible. Your order will be confirmed and processed after the payment has been verified.',
  now()
)
on conflict (region_code, payment_method) do update
set currency = excluded.currency,
    provider_name = excluded.provider_name,
    processing_fee_percent = excluded.processing_fee_percent,
    is_enabled = excluded.is_enabled,
    account_holder_name = excluded.account_holder_name,
    bank_name = excluded.bank_name,
    branch_name = excluded.branch_name,
    account_number = excluded.account_number,
    iban = excluded.iban,
    swift_code = excluded.swift_code,
    instructions = excluded.instructions,
    updated_at = now();
