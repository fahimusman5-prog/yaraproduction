-- Run in the Supabase SQL Editor after applying the production repair migration.
-- Every "missing" or "unsafe" query should return zero rows.

-- Missing required tables.
with required(table_name) as (
  values
    ('profiles'), ('categories'), ('products'), ('skin_concerns'),
    ('product_skin_concerns'), ('orders'), ('order_items'), ('pos_sales'),
    ('pos_sale_items'), ('stock_movements')
)
select required.table_name as missing_table
from required
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = required.table_name
where t.table_name is null
order by required.table_name;

-- Missing columns used by the application.
with required(table_name, column_name) as (
  values
    ('profiles','id'), ('profiles','role'),
    ('categories','id'), ('categories','name'), ('categories','slug'),
    ('categories','status'), ('categories','created_at'), ('categories','updated_at'),
    ('products','id'), ('products','name'), ('products','slug'), ('products','description'),
    ('products','category_id'), ('products','image_url'), ('products','price_lkr'),
    ('products','price_aed'), ('products','sku'), ('products','barcode'),
    ('products','stock_quantity'), ('products','low_stock_alert'), ('products','status'),
    ('products','benefits'), ('products','how_to_use'), ('products','ingredients'),
    ('products','caution'), ('products','original_category'), ('products','image_status'),
    ('products','pdf_source_page'), ('products','seo_title'), ('products','seo_description'),
    ('products','featured'), ('products','created_at'), ('products','updated_at'),
    ('skin_concerns','id'), ('skin_concerns','name'), ('skin_concerns','slug'),
    ('skin_concerns','status'), ('skin_concerns','created_at'), ('skin_concerns','updated_at'),
    ('product_skin_concerns','product_id'), ('product_skin_concerns','skin_concern_id'),
    ('product_skin_concerns','created_at'),
    ('orders','id'), ('orders','order_number'), ('orders','currency'),
    ('orders','payment_status'), ('orders','order_status'),
    ('order_items','order_id'), ('order_items','product_id'),
    ('pos_sales','id'), ('pos_sales','currency'),
    ('pos_sale_items','sale_id'), ('pos_sale_items','product_id'),
    ('stock_movements','product_id'), ('stock_movements','quantity_change'),
    ('stock_movements','previous_stock'), ('stock_movements','new_stock'),
    ('stock_movements','created_by')
)
select required.*
from required
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = required.table_name
 and c.column_name = required.column_name
where c.column_name is null
order by required.table_name, required.column_name;

-- Required primary/foreign-key relationships and validation status.
select
  c.conrelid::regclass::text as table_name,
  c.conname as constraint_name,
  c.convalidated,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.connamespace = 'public'::regnamespace
  and c.conname in (
    'products_category_id_fkey',
    'product_skin_concerns_pkey',
    'product_skin_concerns_product_id_fkey',
    'product_skin_concerns_skin_concern_id_fkey',
    'order_items_order_id_fkey',
    'order_items_product_id_fkey',
    'stock_movements_product_id_fkey'
  )
order by c.conname;

with required(constraint_name) as (
  values
    ('products_category_id_fkey'),
    ('product_skin_concerns_pkey'),
    ('product_skin_concerns_product_id_fkey'),
    ('product_skin_concerns_skin_concern_id_fkey')
)
select required.constraint_name as missing_or_unvalidated_constraint
from required
left join pg_constraint c
  on c.conname = required.constraint_name
 and c.connamespace = 'public'::regnamespace
where c.oid is null or not c.convalidated;

-- Category deletion must be restrictive rather than silently uncategorizing products.
select conname, pg_get_constraintdef(oid) as unsafe_definition
from pg_constraint
where conname = 'products_category_id_fkey'
  and conrelid = 'public.products'::regclass
  and confdeltype <> 'r';

-- Missing indexes used by joins, filters, and uniqueness checks.
with required(index_name) as (
  values
    ('categories_slug_key'), ('categories_name_key'),
    ('products_slug_key'), ('products_sku_key'), ('products_category_id_idx'),
    ('products_status_stock_idx'), ('skin_concerns_slug_key'),
    ('product_skin_concerns_concern_idx'), ('orders_created_at_idx'),
    ('order_items_order_id_idx'), ('pos_sales_created_at_idx'),
    ('pos_sale_items_sale_id_idx'), ('stock_movements_product_created_idx')
)
select required.index_name as missing_index
from required
left join pg_indexes i
  on i.schemaname = 'public' and i.indexname = required.index_name
where i.indexname is null
order by required.index_name;

-- Tables that should have RLS but do not.
select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles','categories','products','skin_concerns','product_skin_concerns',
    'orders','order_items','pos_sales','pos_sale_items','stock_movements'
  )
  and not rowsecurity
order by tablename;

-- Effective policies for review.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in (
    'profiles','categories','products','skin_concerns','product_skin_concerns',
    'orders','order_items','pos_sales','pos_sale_items','stock_movements'
  ))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- Unsafe public write policies. Must return zero rows.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
  and ('public' = any(roles) or 'anon' = any(roles))
  and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  and (coalesce(qual, '') = 'true' or coalesce(with_check, '') = 'true');

-- The anonymous role must have no write privilege on application tables.
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon'
  and table_schema = 'public'
  and table_name in (
    'profiles','categories','products','skin_concerns','product_skin_concerns',
    'orders','order_items','pos_sales','pos_sale_items','stock_movements'
  )
  and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
order by table_name, privilege_type;

-- Server-managed commerce tables must not be directly writable by signed-in users.
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'authenticated'
  and table_schema = 'public'
  and table_name in ('orders','order_items','pos_sales','pos_sale_items','stock_movements')
  and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
order by table_name, privilege_type;

-- Server-only admin RPCs must be executable by service_role only.
with functions(name, signature) as (
  values
    ('save_admin_product', 'public.save_admin_product(uuid,uuid,jsonb,uuid[],integer)'),
    ('adjust_admin_product_stock', 'public.adjust_admin_product_stock(uuid,integer,text,uuid)'),
    ('complete_admin_pos_sale', 'public.complete_admin_pos_sale(text,numeric,jsonb,text,uuid)')
)
select
  name,
  to_regprocedure(signature) is not null as exists,
  case when to_regprocedure(signature) is not null
    then has_function_privilege('anon', to_regprocedure(signature), 'EXECUTE')
    else false end as anon_execute,
  case when to_regprocedure(signature) is not null
    then has_function_privilege('authenticated', to_regprocedure(signature), 'EXECUTE')
    else false end as authenticated_execute,
  case when to_regprocedure(signature) is not null
    then has_function_privilege('service_role', to_regprocedure(signature), 'EXECUTE')
    else false end as service_role_execute
from functions;

-- The legacy authenticated SECURITY DEFINER POS function must be removed.
select to_regprocedure('public.complete_pos_sale(text,numeric,jsonb,text)') as legacy_pos_function;

-- Product image bucket and policies.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'product-images';

-- Public buckets serve object URLs without a table policy; this must return zero.
select policyname, roles, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and cmd = 'SELECT'
  and ('public' = any(roles) or 'anon' = any(roles))
  and coalesce(qual, '') like '%product-images%';

-- Data-integrity checks. Each count should be zero.
select 'orphan_product_skin_concerns' as check_name, count(*) as invalid_rows
from public.product_skin_concerns psc
left join public.products p on p.id = psc.product_id
left join public.skin_concerns sc on sc.id = psc.skin_concern_id
where p.id is null or sc.id is null
union all
select 'orphan_product_categories', count(*)
from public.products p
left join public.categories c on c.id = p.category_id
where p.category_id is not null and c.id is null
union all
select 'duplicate_product_slugs', count(*)
from (select slug from public.products group by slug having count(*) > 1) duplicates
union all
select 'duplicate_product_skus', count(*)
from (select sku from public.products group by sku having count(*) > 1) duplicates
union all
select 'duplicate_category_slugs', count(*)
from (select slug from public.categories group by slug having count(*) > 1) duplicates
union all
select 'duplicate_skin_concern_slugs', count(*)
from (select slug from public.skin_concerns group by slug having count(*) > 1) duplicates;

-- Sensible production counts without exposing customer data.
select
  (select count(*) from public.products) as products,
  (select count(*) from public.products where status = 'active') as active_products,
  (select count(*) from public.categories) as categories,
  (select count(*) from public.skin_concerns) as skin_concerns,
  (select count(*) from public.product_skin_concerns) as product_skin_concerns,
  (select count(*) from public.profiles where role = 'admin') as admins,
  (select count(*) from public.orders) as orders,
  (select count(*) from public.stock_movements) as stock_movements;

-- Product/category summary for manual launch review.
select p.id, p.name, p.slug, p.sku, p.status, p.stock_quantity, c.name as category
from public.products p
left join public.categories c on c.id = p.category_id
order by p.name;

-- Refresh PostgREST after schema or relationship changes.
notify pgrst, 'reload schema';
