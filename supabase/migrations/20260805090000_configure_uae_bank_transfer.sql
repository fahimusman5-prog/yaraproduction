-- Enable the UAE bank transfer account without changing the established LK account.
-- IBAN is sufficient for the supplied UAE account; SWIFT/BIC remains optional.
update public.payment_method_settings
set currency = 'AED',
    provider_name = null,
    processing_fee_percent = 0,
    is_enabled = true,
    account_holder_name = 'FATHIMA FAZEENA FAROOK',
    bank_name = 'Mashreq Bank',
    branch_name = null,
    account_number = '019101283587',
    iban = 'AE660330000019101283587',
    swift_code = null,
    instructions = 'Complete your payment securely using the bank account details below. Please use your Order ID as the payment reference whenever possible. Your order will be confirmed and processed after the payment has been verified.',
    updated_at = now()
where region_code = 'AE'
  and payment_method = 'bank_transfer';
