-- Add the fulfilment fields already written by the admin order-status action.
alter table public.orders
  add column if not exists tracking_url text,
  add column if not exists estimated_delivery_date date;
