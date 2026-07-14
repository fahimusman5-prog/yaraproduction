alter table public.products
  add column if not exists original_price_lkr numeric(12,2),
  add column if not exists original_price_aed numeric(12,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_original_price_lkr_nonnegative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_original_price_lkr_nonnegative
      check (original_price_lkr is null or original_price_lkr >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_original_price_aed_nonnegative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_original_price_aed_nonnegative
      check (original_price_aed is null or original_price_aed >= 0);
  end if;
end
$$;

create or replace function public.save_admin_product(
  p_product_id uuid,
  p_actor_id uuid,
  p_product jsonb,
  p_skin_concern_ids uuid[],
  p_target_stock integer
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_product_id uuid := coalesce(p_product_id, gen_random_uuid());
  v_previous_stock integer := 0;
  v_category_id uuid;
  v_skin_concern_ids uuid[];
  v_valid_concern_count integer;
  v_benefits text[] := '{}'::text[];
  v_price_lkr numeric;
  v_price_aed numeric;
  v_original_price_lkr numeric;
  v_original_price_aed numeric;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;
  if p_product is null or jsonb_typeof(p_product) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid product payload.';
  end if;
  if nullif(trim(p_product->>'name'), '') is null
     or nullif(trim(p_product->>'slug'), '') is null
     or nullif(trim(p_product->>'sku'), '') is null then
    raise exception using errcode = '23514', message = 'Product name, slug, and SKU are required.';
  end if;
  if p_target_stock is null or p_target_stock < 0 then
    raise exception using errcode = '23514', message = 'Stock cannot be negative.';
  end if;

  v_price_lkr := (p_product->>'price_lkr')::numeric;
  v_price_aed := (p_product->>'price_aed')::numeric;
  v_original_price_lkr := nullif(p_product->>'original_price_lkr', '')::numeric;
  v_original_price_aed := nullif(p_product->>'original_price_aed', '')::numeric;

  if v_original_price_lkr is not null and v_original_price_lkr < v_price_lkr then
    raise exception using errcode = '23514', message = 'Sri Lanka original price must be higher than the selling price.';
  end if;
  if v_original_price_aed is not null and v_original_price_aed < v_price_aed then
    raise exception using errcode = '23514', message = 'UAE original price must be higher than the selling price.';
  end if;

  v_category_id := nullif(p_product->>'category_id', '')::uuid;
  if v_category_id is not null and not exists (
    select 1 from public.categories where id = v_category_id
  ) then
    raise exception using errcode = '23503', message = 'Selected category does not exist.';
  end if;

  select coalesce(array_agg(id order by id), '{}'::uuid[])
  into v_skin_concern_ids
  from (
    select distinct unnest(coalesce(p_skin_concern_ids, '{}'::uuid[])) as id
  ) selected;

  select count(*) into v_valid_concern_count
  from public.skin_concerns
  where id = any(v_skin_concern_ids);
  if v_valid_concern_count <> cardinality(v_skin_concern_ids) then
    raise exception using errcode = '23503', message = 'One or more selected skin concerns do not exist.';
  end if;

  if jsonb_typeof(p_product->'benefits') = 'array' then
    select coalesce(array_agg(value), '{}'::text[])
    into v_benefits
    from jsonb_array_elements_text(p_product->'benefits') benefit(value);
  end if;

  if p_product_id is null then
    insert into public.products (
      id, name, slug, description, category_id, image_url, price_lkr, price_aed,
      original_price_lkr, original_price_aed, sku, barcode, stock_quantity,
      low_stock_alert, status, benefits, how_to_use, ingredients, caution,
      original_category, image_status, pdf_source_page, seo_title,
      seo_description, featured
    ) values (
      v_product_id, trim(p_product->>'name'), trim(p_product->>'slug'), coalesce(p_product->>'description', ''),
      v_category_id, nullif(p_product->>'image_url', ''), v_price_lkr, v_price_aed,
      v_original_price_lkr, v_original_price_aed, trim(p_product->>'sku'), nullif(p_product->>'barcode', ''),
      0, (p_product->>'low_stock_alert')::integer, p_product->>'status', v_benefits,
      coalesce(p_product->>'how_to_use', ''), coalesce(p_product->>'ingredients', ''),
      coalesce(p_product->>'caution', ''), coalesce(p_product->>'original_category', ''),
      coalesce(p_product->>'image_status', ''), coalesce(p_product->>'pdf_source_page', ''),
      coalesce(p_product->>'seo_title', ''), coalesce(p_product->>'seo_description', ''),
      coalesce((p_product->>'featured')::boolean, false)
    );
  else
    select stock_quantity into v_previous_stock
    from public.products
    where id = p_product_id
    for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'Product not found.';
    end if;

    update public.products set
      name = trim(p_product->>'name'),
      slug = trim(p_product->>'slug'),
      description = coalesce(p_product->>'description', ''),
      category_id = v_category_id,
      image_url = nullif(p_product->>'image_url', ''),
      price_lkr = v_price_lkr,
      price_aed = v_price_aed,
      original_price_lkr = v_original_price_lkr,
      original_price_aed = v_original_price_aed,
      sku = trim(p_product->>'sku'),
      barcode = nullif(p_product->>'barcode', ''),
      low_stock_alert = (p_product->>'low_stock_alert')::integer,
      status = p_product->>'status',
      benefits = v_benefits,
      how_to_use = coalesce(p_product->>'how_to_use', ''),
      ingredients = coalesce(p_product->>'ingredients', ''),
      caution = coalesce(p_product->>'caution', ''),
      original_category = coalesce(p_product->>'original_category', ''),
      image_status = coalesce(p_product->>'image_status', ''),
      pdf_source_page = coalesce(p_product->>'pdf_source_page', ''),
      seo_title = coalesce(p_product->>'seo_title', ''),
      seo_description = coalesce(p_product->>'seo_description', ''),
      featured = coalesce((p_product->>'featured')::boolean, false)
    where id = p_product_id;
  end if;

  delete from public.product_skin_concerns where product_id = v_product_id;
  insert into public.product_skin_concerns (product_id, skin_concern_id)
  select v_product_id, unnest(v_skin_concern_ids);

  if p_target_stock <> v_previous_stock then
    update public.products set stock_quantity = p_target_stock where id = v_product_id;
    insert into public.stock_movements (
      product_id, movement_type, quantity_change, previous_stock, new_stock, created_by
    ) values (
      v_product_id,
      case when p_target_stock > v_previous_stock then 'restock' else 'manual_adjustment' end,
      p_target_stock - v_previous_stock,
      v_previous_stock,
      p_target_stock,
      p_actor_id
    );
  end if;

  return v_product_id;
end;
$$;

revoke all on function public.save_admin_product(uuid, uuid, jsonb, uuid[], integer) from public, anon, authenticated;
grant execute on function public.save_admin_product(uuid, uuid, jsonb, uuid[], integer) to service_role;
