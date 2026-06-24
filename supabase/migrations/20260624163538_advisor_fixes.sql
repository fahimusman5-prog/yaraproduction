drop function if exists public.complete_pos_sale(text, numeric, jsonb);

create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists pos_sale_items_product_id_idx on public.pos_sale_items(product_id);
create index if not exists pos_sales_cashier_id_idx on public.pos_sales(cashier_id);
create index if not exists stock_movements_created_by_idx on public.stock_movements(created_by);
