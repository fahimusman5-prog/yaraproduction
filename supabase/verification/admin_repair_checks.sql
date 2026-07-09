-- Run these in Supabase SQL Editor after applying the repair migration.

-- Required tables.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'products',
    'categories',
    'skin_concerns',
    'product_skin_concerns',
    'orders',
    'order_items',
    'profiles',
    'pos_sales',
    'pos_sale_items',
    'stock_movements'
  )
order by table_name;

-- Missing columns the current app expects.
with required(table_name, column_name) as (
  values
    ('products','id'), ('products','name'), ('products','slug'), ('products','description'),
    ('products','category_id'), ('products','image_url'), ('products','price_lkr'),
    ('products','price_aed'), ('products','sku'), ('products','barcode'),
    ('products','stock_quantity'), ('products','low_stock_alert'), ('products','status'),
    ('products','benefits'), ('products','how_to_use'), ('products','ingredients'),
    ('products','caution'), ('products','original_category'), ('products','image_status'),
    ('products','pdf_source_page'), ('products','seo_title'), ('products','seo_description'),
    ('products','featured'), ('products','created_at'), ('products','updated_at'),
    ('categories','id'), ('categories','name'), ('categories','slug'), ('categories','status'),
    ('skin_concerns','id'), ('skin_concerns','name'), ('skin_concerns','slug'), ('skin_concerns','status'),
    ('product_skin_concerns','product_id'), ('product_skin_concerns','skin_concern_id'),
    ('stock_movements','product_id'), ('stock_movements','quantity_change'),
    ('stock_movements','previous_stock'), ('stock_movements','new_stock'), ('stock_movements','created_by')
)
select required.*
from required
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = required.table_name
 and c.column_name = required.column_name
where c.column_name is null
order by required.table_name, required.column_name;

-- Foreign keys and relation names used by PostgREST embeds.
select
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in ('products', 'product_skin_concerns', 'order_items', 'stock_movements')
order by tc.table_name, tc.constraint_name;

-- RLS status.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('products','categories','skin_concerns','product_skin_concerns','orders','order_items','profiles','pos_sales','pos_sale_items','stock_movements')
order by tablename;

-- Policies.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('products','categories','skin_concerns','product_skin_concerns','orders','order_items','profiles','pos_sales','pos_sale_items','stock_movements')
order by tablename, policyname;

-- Product edit test record.
select id, name, slug, sku, status, stock_quantity
from public.products
where id = '8cc2b446-3b0d-4ffd-b69b-7786d03559c6';

-- PostgREST cache reload if needed.
notify pgrst, 'reload schema';
