drop function if exists public.complete_pos_sale(text, numeric, jsonb, text);

revoke insert, update, delete, truncate, references, trigger
on public.orders, public.order_items, public.pos_sales, public.pos_sale_items, public.stock_movements
from authenticated;

notify pgrst, 'reload schema';
