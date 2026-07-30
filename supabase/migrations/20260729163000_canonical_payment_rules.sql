-- Make payment pricing an application invariant instead of an admin setting.
-- The settings table remains for regional bank-transfer instructions and
-- historical compatibility; provider activation is controlled server-side.

update public.payment_method_settings
set
  processing_fee_percent = case payment_method
    when 'card' then 4
    when 'koko' then 9
    when 'mintpay' then 4
    else 0
  end,
  minimum_order_amount = null,
  maximum_order_amount = null,
  is_enabled = true,
  updated_at = now();

alter table public.payment_method_settings
  drop constraint if exists payment_method_settings_canonical_fee_check;
alter table public.payment_method_settings
  add constraint payment_method_settings_canonical_fee_check check (
    processing_fee_percent = case payment_method
      when 'card' then 4
      when 'koko' then 9
      when 'mintpay' then 4
      else 0
    end
  );

alter table public.payment_method_settings
  drop constraint if exists payment_method_settings_no_order_limits_check;
alter table public.payment_method_settings
  add constraint payment_method_settings_no_order_limits_check check (
    minimum_order_amount is null and maximum_order_amount is null
  );

create or replace function public.apply_canonical_order_payment_totals()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_base numeric;
  v_rate numeric;
begin
  if new.payment_method not in (
    'card', 'koko', 'mintpay', 'bank_transfer', 'cash_on_delivery'
  ) then
    return new;
  end if;

  v_rate := case new.payment_method
    when 'card' then 4
    when 'koko' then 9
    when 'mintpay' then 4
    else 0
  end;
  v_base :=
    greatest(0, new.subtotal_amount - new.discount_amount)
    + new.shipping_fee;

  new.processing_fee_percent := v_rate;
  new.payment_fee := case
    when new.currency = 'LKR' then round(v_base * v_rate / 100)
    else round(v_base * v_rate / 100, 2)
  end;
  new.total_amount := v_base + new.payment_fee;
  return new;
end;
$$;

drop trigger if exists orders_apply_canonical_payment_totals
  on public.orders;
create trigger orders_apply_canonical_payment_totals
before insert or update of
  payment_method, subtotal_amount, discount_amount, shipping_fee, currency
on public.orders
for each row execute function public.apply_canonical_order_payment_totals();

comment on function public.apply_canonical_order_payment_totals() is
  'Enforces Card 4%, Koko 9%, MintPay 4%, Bank Transfer 0%, and COD 0%; LKR rounds to whole units and AED to two decimals.';
