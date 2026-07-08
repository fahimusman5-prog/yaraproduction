alter table public.products add column if not exists benefits text[] not null default '{}'::text[];
alter table public.products add column if not exists how_to_use text not null default '';
alter table public.products add column if not exists ingredients text not null default '';
alter table public.products add column if not exists caution text not null default '';
alter table public.products add column if not exists original_category text not null default '';
alter table public.products add column if not exists image_status text not null default '';
alter table public.products add column if not exists pdf_source_page text not null default '';
alter table public.products add column if not exists seo_title text not null default '';
alter table public.products add column if not exists seo_description text not null default '';
alter table public.products add column if not exists featured boolean not null default false;

create table if not exists public.skin_concerns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.product_skin_concerns (
  product_id uuid not null references public.products(id) on delete cascade,
  skin_concern_id uuid not null references public.skin_concerns(id) on delete cascade,
  primary key (product_id, skin_concern_id)
);

create index if not exists product_skin_concerns_concern_idx on public.product_skin_concerns(skin_concern_id);
alter table public.skin_concerns enable row level security;
alter table public.product_skin_concerns enable row level security;

drop policy if exists "Active skin concerns are public" on public.skin_concerns;
create policy "Active skin concerns are public" on public.skin_concerns for select to anon, authenticated using (status = 'active' or (select private.is_staff()));
drop policy if exists "Staff insert skin concerns" on public.skin_concerns;
create policy "Staff insert skin concerns" on public.skin_concerns for insert to authenticated with check ((select private.is_staff()));
drop policy if exists "Staff update skin concerns" on public.skin_concerns;
create policy "Staff update skin concerns" on public.skin_concerns for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Staff delete skin concerns" on public.skin_concerns;
create policy "Staff delete skin concerns" on public.skin_concerns for delete to authenticated using ((select private.is_staff()));
drop policy if exists "Product skin concerns are public" on public.product_skin_concerns;
create policy "Product skin concerns are public" on public.product_skin_concerns for select to anon, authenticated using (true);
drop policy if exists "Staff manage product skin concerns" on public.product_skin_concerns;
create policy "Staff manage product skin concerns" on public.product_skin_concerns for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

grant select on public.skin_concerns, public.product_skin_concerns to anon, authenticated;
grant select, insert, update, delete on public.skin_concerns, public.product_skin_concerns to authenticated;

insert into public.categories(name, slug, status) values
  ('Face Care', 'face-care', 'active'),
  ('Body Care', 'body-care', 'active'),
  ('Soap Collection', 'soap-collection', 'active'),
  ('Hair Care', 'hair-care', 'active'),
  ('Lip Care', 'lip-care', 'active'),
  ('Herbal Powders & Face Packs', 'herbal-powders-face-packs', 'active'),
  ('Bridal & Whitening Packages', 'bridal-whitening-packages', 'active'),
  ('Supplements', 'supplements', 'active'),
  ('Weight Loss / Wellness', 'weight-loss-wellness', 'active'),
  ('Combos & Kits', 'combos-kits', 'active')
on conflict (slug) do update set name = excluded.name, status = excluded.status;

insert into public.skin_concerns(name, slug, status) values
  ('Brightening', 'brightening', 'active'),
  ('Acne Care', 'acne-care', 'active'),
  ('Pigmentation', 'pigmentation', 'active'),
  ('Dry Skin', 'dry-skin', 'active'),
  ('Sun Protection', 'sun-protection', 'active'),
  ('Body Care', 'body-care', 'active'),
  ('Anti-Aging', 'anti-aging', 'active'),
  ('Lip Care', 'lip-care', 'active'),
  ('Men''s Care', 'men-s-care', 'active'),
  ('Hair Care', 'hair-care', 'active'),
  ('Wellness', 'wellness', 'active')
on conflict (slug) do update set name = excluded.name, status = excluded.status;

do $$
declare
  v_product_id uuid;
  v_category_id uuid;
  v_concern text;
begin

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Alpha Arbutin Cleanser') or slug = 'yara-alpha-arbutin-cleanser' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Alpha Arbutin Cleanser', 'yara-alpha-arbutin-cleanser', 'A daily facial cleanser designed to cleanse impurities and support brighter, more even-looking skin.', v_category_id, 0, 0, 'YARA-YARA-ALPH-ARBU-CLEA', 0, 5, 'active', array['Helps improve the appearance of dark spots','Helps improve hyperpigmentation','Promotes pinkish glowing skin','Tones the skin','Cleans impurities and pollution','Helps reduce tanning','Helps control melanin production']::text[], 'Apply a small amount of YARA Alpha Arbutin Cleanser and gently work into a lather using circular motions. Wash off and pat dry. Use twice daily.', '', 'For external use only. Avoid contact with eyes. Discontinue use if irritation occurs.', 'Face Cleansing & Daily Skin Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 2', 'YARA Alpha Arbutin Cleanser | YARA Productions', 'A daily facial cleanser designed to cleanse impurities and support brighter, more even-looking skin.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Alpha Arbutin Cleanser', slug = 'yara-alpha-arbutin-cleanser', description = 'A daily facial cleanser designed to cleanse impurities and support brighter, more even-looking skin.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-ALPH-ARBU-CLEA'), status = 'active', benefits = array['Helps improve the appearance of dark spots','Helps improve hyperpigmentation','Promotes pinkish glowing skin','Tones the skin','Cleans impurities and pollution','Helps reduce tanning','Helps control melanin production']::text[], how_to_use = 'Apply a small amount of YARA Alpha Arbutin Cleanser and gently work into a lather using circular motions. Wash off and pat dry. Use twice daily.', ingredients = '', caution = 'For external use only. Avoid contact with eyes. Discontinue use if irritation occurs.', original_category = 'Face Cleansing & Daily Skin Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 2', seo_title = 'YARA Alpha Arbutin Cleanser | YARA Productions', seo_description = 'A daily facial cleanser designed to cleanse impurities and support brighter, more even-looking skin.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Acne Care','Pigmentation','Brightening']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Alpha Arbutin Serum') or slug = 'yara-alpha-arbutin-serum' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Alpha Arbutin Serum', 'yara-alpha-arbutin-serum', 'A brightening serum made to support a pinkish glow and reduce the appearance of pigmentation and dark spots.', v_category_id, 0, 0, 'YARA-YARA-ALPH-ARBU-SERU', 0, 5, 'active', array['Helps reduce the appearance of pigmentation and dark spots','Helps improve the appearance of uneven tone','Supports pinkish brightening','Deep hydration','Anti-aging benefits','Helps improve the appearance of hyperpigmentation','Helps balance complexion']::text[], 'Massage into cleansed skin while skin is still damp. Use as part of the morning and evening skincare routine.', '', 'For external use only. Patch test before use. Avoid contact with eyes.', 'Face Serum', 'Use PDF image first / replace later with clean product photo', 'PDF page 3', 'YARA Alpha Arbutin Serum | YARA Productions', 'A brightening serum made to support a pinkish glow and reduce the appearance of pigmentation and dark spots.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Alpha Arbutin Serum', slug = 'yara-alpha-arbutin-serum', description = 'A brightening serum made to support a pinkish glow and reduce the appearance of pigmentation and dark spots.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-ALPH-ARBU-SERU'), status = 'active', benefits = array['Helps reduce the appearance of pigmentation and dark spots','Helps improve the appearance of uneven tone','Supports pinkish brightening','Deep hydration','Anti-aging benefits','Helps improve the appearance of hyperpigmentation','Helps balance complexion']::text[], how_to_use = 'Massage into cleansed skin while skin is still damp. Use as part of the morning and evening skincare routine.', ingredients = '', caution = 'For external use only. Patch test before use. Avoid contact with eyes.', original_category = 'Face Serum', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 3', seo_title = 'YARA Alpha Arbutin Serum | YARA Productions', seo_description = 'A brightening serum made to support a pinkish glow and reduce the appearance of pigmentation and dark spots.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Pigmentation','Anti-Aging']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Pinkish Night Cream') or slug = 'yara-pinkish-night-cream' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Pinkish Night Cream', 'yara-pinkish-night-cream', 'A night cream designed to support a brighter-looking complexion, improved skin texture, and a smoother appearance.', v_category_id, 0, 0, 'YARA-YARA-PINK-NIGH-CREA', 0, 5, 'active', array['Supports pinkish skin tone','Brighter complexion','Helps reduce the appearance of pigmentation','Improves skin texture','Helps improve the appearance of blemishes','Enhances skin density','Reduces fine lines and signs of aging']::text[], 'Wash the area using soap or face wash. Gently massage the cream in circular motions for a few minutes. Suitable for both men and women.', 'Aqua, Mineral Oil, Vitamin E, Kojic, Fragrance, Carrot Oil, Collagen, Vitamin C, Glycerin, Citric Acid, Saffron Oil, Lanolin, Petroleum Paraffin, Sodium Lauryl Sulfate, BHT, Shea Butter, Paraffin, Essential Oil, Vitamin B3', 'For external use only. Avoid contact with eyes. Discontinue use if irritation occurs.', 'Face Cream', 'Use PDF image first / replace later with clean product photo', 'PDF page 4', 'YARA Pinkish Night Cream | YARA Productions', 'A night cream designed to support a brighter-looking complexion, improved skin texture, and a smoother appearance.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Pinkish Night Cream', slug = 'yara-pinkish-night-cream', description = 'A night cream designed to support a brighter-looking complexion, improved skin texture, and a smoother appearance.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-PINK-NIGH-CREA'), status = 'active', benefits = array['Supports pinkish skin tone','Brighter complexion','Helps reduce the appearance of pigmentation','Improves skin texture','Helps improve the appearance of blemishes','Enhances skin density','Reduces fine lines and signs of aging']::text[], how_to_use = 'Wash the area using soap or face wash. Gently massage the cream in circular motions for a few minutes. Suitable for both men and women.', ingredients = 'Aqua, Mineral Oil, Vitamin E, Kojic, Fragrance, Carrot Oil, Collagen, Vitamin C, Glycerin, Citric Acid, Saffron Oil, Lanolin, Petroleum Paraffin, Sodium Lauryl Sulfate, BHT, Shea Butter, Paraffin, Essential Oil, Vitamin B3', caution = 'For external use only. Avoid contact with eyes. Discontinue use if irritation occurs.', original_category = 'Face Cream', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 4', seo_title = 'YARA Pinkish Night Cream | YARA Productions', seo_description = 'A night cream designed to support a brighter-looking complexion, improved skin texture, and a smoother appearance.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Pigmentation','Anti-Aging']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'body-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Body Lotion') or slug = 'yara-body-lotion' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Body Lotion', 'yara-body-lotion', 'A fast-absorbing body lotion that hydrates the skin and supports a smooth, glowing look.', v_category_id, 0, 0, 'YARA-YARA-BODY-LOTI', 0, 5, 'active', array['Luxurious white tone','Anti-aging properties','Hydration boost','Helps improve the appearance of blemishes','Fast absorption','Non-irritating formula','Youthful glow','Non-greasy feel']::text[], 'Pump a small amount of body lotion into your hands and massage into cleansed skin using circular motions. For best results, use twice daily.', '', 'For external use only. Discontinue use if irritation occurs.', 'Body Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 5', 'YARA Body Lotion | YARA Productions', 'A fast-absorbing body lotion that hydrates the skin and supports a smooth, glowing look.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Body Lotion', slug = 'yara-body-lotion', description = 'A fast-absorbing body lotion that hydrates the skin and supports a smooth, glowing look.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-BODY-LOTI'), status = 'active', benefits = array['Luxurious white tone','Anti-aging properties','Hydration boost','Helps improve the appearance of blemishes','Fast absorption','Non-irritating formula','Youthful glow','Non-greasy feel']::text[], how_to_use = 'Pump a small amount of body lotion into your hands and massage into cleansed skin using circular motions. For best results, use twice daily.', ingredients = '', caution = 'For external use only. Discontinue use if irritation occurs.', original_category = 'Body Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 5', seo_title = 'YARA Body Lotion | YARA Productions', seo_description = 'A fast-absorbing body lotion that hydrates the skin and supports a smooth, glowing look.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Dry Skin','Body Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'combos-kits';
  select id into v_product_id from public.products where lower(name) = lower('YARA Treatment Kit') or slug = 'yara-treatment-kit' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Treatment Kit', 'yara-treatment-kit', 'A complete acne-focused skincare kit designed to cleanse, treat, protect, and support clearer-looking skin.', v_category_id, 0, 0, 'YARA-YARA-TREA-KIT', 0, 5, 'active', array['Helps target acne-causing bacteria','Unclogs pores','Reduces inflammation','Helps clear existing pimples','Helps reduce the chance of future breakouts','Promotes smoother-looking skin']::text[], 'Use the cleanser morning and night. Follow with the treatment soap three times daily. In the morning, apply sun gel after cleansing. At night, apply the night cream after cleansing. Use consistently for best results.', '', 'For external use only. Avoid contact with eyes. Stop use if irritation occurs.', 'Combos & Kits', 'Use PDF image first / replace later with clean product photo', 'PDF page 6', 'YARA Treatment Kit | YARA Productions', 'A complete acne-focused skincare kit designed to cleanse, treat, protect, and support clearer-looking skin.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Treatment Kit', slug = 'yara-treatment-kit', description = 'A complete acne-focused skincare kit designed to cleanse, treat, protect, and support clearer-looking skin.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-TREA-KIT'), status = 'active', benefits = array['Helps target acne-causing bacteria','Unclogs pores','Reduces inflammation','Helps clear existing pimples','Helps reduce the chance of future breakouts','Promotes smoother-looking skin']::text[], how_to_use = 'Use the cleanser morning and night. Follow with the treatment soap three times daily. In the morning, apply sun gel after cleansing. At night, apply the night cream after cleansing. Use consistently for best results.', ingredients = '', caution = 'For external use only. Avoid contact with eyes. Stop use if irritation occurs.', original_category = 'Combos & Kits', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 6', seo_title = 'YARA Treatment Kit | YARA Productions', seo_description = 'A complete acne-focused skincare kit designed to cleanse, treat, protect, and support clearer-looking skin.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Acne Care','Brightening','Sun Protection']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Saffron Face Wash') or slug = 'yara-saffron-face-wash' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Saffron Face Wash', 'yara-saffron-face-wash', 'A soap-free saffron face wash that deeply cleanses while supporting brighter, smoother-looking skin.', v_category_id, 0, 0, 'YARA-YARA-SAFF-FACE-WASH', 0, 5, 'active', array['Skin brightening','Deep cleansing','Anti-aging support','Oil control','Improves skin texture','Exfoliating','Smoothing','Soap-free formulation']::text[], 'Moisten face and neck, apply a small amount of YARA Saffron Face Wash, and gently work up a lather using circular motions. Wash off and pat dry. Use twice daily.', '', 'For external use only. Avoid contact with eyes.', 'Face Wash', 'Use PDF image first / replace later with clean product photo', 'PDF page 8', 'YARA Saffron Face Wash | YARA Productions', 'A soap-free saffron face wash that deeply cleanses while supporting brighter, smoother-looking skin.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Saffron Face Wash', slug = 'yara-saffron-face-wash', description = 'A soap-free saffron face wash that deeply cleanses while supporting brighter, smoother-looking skin.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-SAFF-FACE-WASH'), status = 'active', benefits = array['Skin brightening','Deep cleansing','Anti-aging support','Oil control','Improves skin texture','Exfoliating','Smoothing','Soap-free formulation']::text[], how_to_use = 'Moisten face and neck, apply a small amount of YARA Saffron Face Wash, and gently work up a lather using circular motions. Wash off and pat dry. Use twice daily.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Face Wash', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 8', seo_title = 'YARA Saffron Face Wash | YARA Productions', seo_description = 'A soap-free saffron face wash that deeply cleanses while supporting brighter, smoother-looking skin.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Acne Care','Pigmentation','Sun Protection','Brightening','Men''s Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Saffron Serum') or slug = 'yara-saffron-serum' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Saffron Serum', 'yara-saffron-serum', 'A saffron serum designed to promote a glassy shine, brighten the skin, and support smoother-looking texture.', v_category_id, 0, 0, 'YARA-YARA-SAFF-SERU', 0, 5, 'active', array['Glassy shine skin','Helps improve the appearance of pigmentation','Helps improve the appearance of pimple marks','Brightens skin','Radiant healthy-looking skin','Reduces fine lines and wrinkles','Collagen boost','Anti-aging support']::text[], 'Take 3-4 drops of serum and gently massage onto face and neck for about 5 minutes. Leave on for 2 hours, then rinse with water. Use morning and night for best results.', '', 'For external use only. Patch test before use.', 'Face Serum', 'Use PDF image first / replace later with clean product photo', 'PDF page 9', 'YARA Saffron Serum | YARA Productions', 'A saffron serum designed to promote a glassy shine, brighten the skin, and support smoother-looking texture.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Saffron Serum', slug = 'yara-saffron-serum', description = 'A saffron serum designed to promote a glassy shine, brighten the skin, and support smoother-looking texture.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-SAFF-SERU'), status = 'active', benefits = array['Glassy shine skin','Helps improve the appearance of pigmentation','Helps improve the appearance of pimple marks','Brightens skin','Radiant healthy-looking skin','Reduces fine lines and wrinkles','Collagen boost','Anti-aging support']::text[], how_to_use = 'Take 3-4 drops of serum and gently massage onto face and neck for about 5 minutes. Leave on for 2 hours, then rinse with water. Use morning and night for best results.', ingredients = '', caution = 'For external use only. Patch test before use.', original_category = 'Face Serum', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 9', seo_title = 'YARA Saffron Serum | YARA Productions', seo_description = 'A saffron serum designed to promote a glassy shine, brighten the skin, and support smoother-looking texture.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Pigmentation','Sun Protection','Anti-Aging','Men''s Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Day Cream') or slug = 'yara-day-cream' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Day Cream', 'yara-day-cream', 'A day cream that supports a youthful, firmer-looking appearance while helping protect against sun damage.', v_category_id, 0, 0, 'YARA-YARA-DAY-CREA', 0, 5, 'active', array['Boosts collagen production','Reduces wrinkles and fine lines','Firms and plumps skin','Helps reduce the chance of sun damage','Promotes youthful appearance']::text[], 'Wash the area using soap or face wash. Gently massage the cream in circular motions for a few minutes. Suitable for both men and women.', '', 'For external use only. Avoid contact with eyes.', 'Face Cream', 'Use PDF image first / replace later with clean product photo', 'PDF page 10', 'YARA Day Cream | YARA Productions', 'A day cream that supports a youthful, firmer-looking appearance while helping protect against sun damage.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Day Cream', slug = 'yara-day-cream', description = 'A day cream that supports a youthful, firmer-looking appearance while helping protect against sun damage.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-DAY-CREA'), status = 'active', benefits = array['Boosts collagen production','Reduces wrinkles and fine lines','Firms and plumps skin','Helps reduce the chance of sun damage','Promotes youthful appearance']::text[], how_to_use = 'Wash the area using soap or face wash. Gently massage the cream in circular motions for a few minutes. Suitable for both men and women.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Face Cream', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 10', seo_title = 'YARA Day Cream | YARA Productions', seo_description = 'A day cream that supports a youthful, firmer-looking appearance while helping protect against sun damage.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Pigmentation','Sun Protection']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA VIP Face Cream') or slug = 'yara-vip-face-cream' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA VIP Face Cream', 'yara-vip-face-cream', 'A luxury face cream designed to support a royal glow, even-looking skin tone, and radiant complexion.', v_category_id, 0, 0, 'YARA-YARA-VIP-FACE-CREA', 0, 5, 'active', array['Supports a brighter-looking finish','Supports a more even-looking tone over time','Fast absorbing','Non-greasy formula','Protects skin from the sun','Evens skin tone','Enhances complexion']::text[], 'Apply a small amount of YARA face cream into your hands and massage into cleansed skin using circular motions over face and neck. Use twice daily for best results.', '', 'For external use only. Avoid contact with eyes.', 'Face Cream', 'Use PDF image first / replace later with clean product photo', 'PDF page 11', 'YARA VIP Face Cream | YARA Productions', 'A luxury face cream designed to support a royal glow, even-looking skin tone, and radiant complexion.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA VIP Face Cream', slug = 'yara-vip-face-cream', description = 'A luxury face cream designed to support a royal glow, even-looking skin tone, and radiant complexion.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-VIP-FACE-CREA'), status = 'active', benefits = array['Supports a brighter-looking finish','Supports a more even-looking tone over time','Fast absorbing','Non-greasy formula','Protects skin from the sun','Evens skin tone','Enhances complexion']::text[], how_to_use = 'Apply a small amount of YARA face cream into your hands and massage into cleansed skin using circular motions over face and neck. Use twice daily for best results.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Face Cream', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 11', seo_title = 'YARA VIP Face Cream | YARA Productions', seo_description = 'A luxury face cream designed to support a royal glow, even-looking skin tone, and radiant complexion.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Dry Skin','Anti-Aging']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'body-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA VIP Body Lotion') or slug = 'yara-vip-body-lotion' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA VIP Body Lotion', 'yara-vip-body-lotion', 'A VIP body lotion designed to support brighter, smoother, and more radiant-looking body skin.', v_category_id, 0, 0, 'YARA-YARA-VIP-BODY-LOTI', 0, 5, 'active', array['Supports a brighter-looking finish','Supports a more even-looking tone over time','Fast absorbing','Non-greasy formula','Protects skin from the sun','Evens skin tone','Enhances complexion']::text[], 'Apply a small amount of YARA body lotion into your hands and massage into cleansed skin using circular motions all over the body. Use twice daily for best results.', '', 'For external use only. Stop use if irritation occurs.', 'Body Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 12', 'YARA VIP Body Lotion | YARA Productions', 'A VIP body lotion designed to support brighter, smoother, and more radiant-looking body skin.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA VIP Body Lotion', slug = 'yara-vip-body-lotion', description = 'A VIP body lotion designed to support brighter, smoother, and more radiant-looking body skin.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-VIP-BODY-LOTI'), status = 'active', benefits = array['Supports a brighter-looking finish','Supports a more even-looking tone over time','Fast absorbing','Non-greasy formula','Protects skin from the sun','Evens skin tone','Enhances complexion']::text[], how_to_use = 'Apply a small amount of YARA body lotion into your hands and massage into cleansed skin using circular motions all over the body. Use twice daily for best results.', ingredients = '', caution = 'For external use only. Stop use if irritation occurs.', original_category = 'Body Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 12', seo_title = 'YARA VIP Body Lotion | YARA Productions', seo_description = 'A VIP body lotion designed to support brighter, smoother, and more radiant-looking body skin.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Body Care','Dry Skin','Anti-Aging']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'combos-kits';
  select id into v_product_id from public.products where lower(name) = lower('YARA VIP Kit') or slug = 'yara-vip-kit' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA VIP Kit', 'yara-vip-kit', 'A VIP brightening support kit with face cream and body lotion for a smoother, brighter, more radiant-looking complexion.', v_category_id, 0, 0, 'YARA-YARA-VIP-KIT', 0, 5, 'active', array['Brightens and evens out skin tone','Supports a smooth radiant look','Helps reduce dark spots and pigmentation','Helps reduce dullness','Deeply moisturizes skin']::text[], 'Apply the face cream and body lotion evenly on clean skin morning and night. Use consistently and avoid sun exposure or apply sunscreen when outdoors.', '', 'For external use only. Use sunscreen when outdoors.', 'Combos & Kits', 'Use PDF image first / replace later with clean product photo', 'PDF page 13', 'YARA VIP Kit | YARA Productions', 'A VIP brightening support kit with face cream and body lotion for a smoother, brighter, more radiant-looking complexion.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA VIP Kit', slug = 'yara-vip-kit', description = 'A VIP brightening support kit with face cream and body lotion for a smoother, brighter, more radiant-looking complexion.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-VIP-KIT'), status = 'active', benefits = array['Brightens and evens out skin tone','Supports a smooth radiant look','Helps reduce dark spots and pigmentation','Helps reduce dullness','Deeply moisturizes skin']::text[], how_to_use = 'Apply the face cream and body lotion evenly on clean skin morning and night. Use consistently and avoid sun exposure or apply sunscreen when outdoors.', ingredients = '', caution = 'For external use only. Use sunscreen when outdoors.', original_category = 'Combos & Kits', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 13', seo_title = 'YARA VIP Kit | YARA Productions', seo_description = 'A VIP brightening support kit with face cream and body lotion for a smoother, brighter, more radiant-looking complexion.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Body Care','Anti-Aging']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'body-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Multi Solution Body Lotion For Men') or slug = 'yara-multi-solution-body-lotion-for-men' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Multi Solution Body Lotion For Men', 'yara-multi-solution-body-lotion-for-men', 'A daily moisturizing body lotion for men, enriched with saffron, niacinamide, vitamins, and long-lasting oudh fragrance.', v_category_id, 0, 0, 'YARA-YARA-MULT-SOLU-BODY', 0, 5, 'active', array['Deep hydration','Brightens dull skin','Helps reduce uneven skin tone','Nourishes and softens skin','Enriched with saffron, niacinamide and vitamins','Long-lasting oudh fragrance']::text[], 'After showering, apply evenly over the body, focusing on dry or uneven areas. For best results, use daily as part of the skincare routine.', 'Deionized Water (Aqua), Mineral Oil, Glycerin, Kojic Acid, Niacinamide (Vitamin B3), Vitamin C, Vitamin E, Licorice Decoction, Saffron Oil (Crocus Sativus), Pomegranate Oil, Jojoba Oil, Jujuba Oil, Olive Oil, Collagen, Shea Butter, Cocoa Butter, Beeswax, Lanolin, Petroleum Paraffin, Citric Acid, Essential Oil, Oudh Fragrance, Sodium Lauryl Sulfate (SLS), Sodium Sulfate, BHT, Germall Plus', 'For external use only. Avoid contact with eyes.', 'Men''s Skin Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 15', 'YARA Multi Solution Body Lotion For Men | YARA Productions', 'A daily moisturizing body lotion for men, enriched with saffron, niacinamide, vitamins, and long-lasting oudh fragrance.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Multi Solution Body Lotion For Men', slug = 'yara-multi-solution-body-lotion-for-men', description = 'A daily moisturizing body lotion for men, enriched with saffron, niacinamide, vitamins, and long-lasting oudh fragrance.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-MULT-SOLU-BODY'), status = 'active', benefits = array['Deep hydration','Brightens dull skin','Helps reduce uneven skin tone','Nourishes and softens skin','Enriched with saffron, niacinamide and vitamins','Long-lasting oudh fragrance']::text[], how_to_use = 'After showering, apply evenly over the body, focusing on dry or uneven areas. For best results, use daily as part of the skincare routine.', ingredients = 'Deionized Water (Aqua), Mineral Oil, Glycerin, Kojic Acid, Niacinamide (Vitamin B3), Vitamin C, Vitamin E, Licorice Decoction, Saffron Oil (Crocus Sativus), Pomegranate Oil, Jojoba Oil, Jujuba Oil, Olive Oil, Collagen, Shea Butter, Cocoa Butter, Beeswax, Lanolin, Petroleum Paraffin, Citric Acid, Essential Oil, Oudh Fragrance, Sodium Lauryl Sulfate (SLS), Sodium Sulfate, BHT, Germall Plus', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Men''s Skin Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 15', seo_title = 'YARA Multi Solution Body Lotion For Men | YARA Productions', seo_description = 'A daily moisturizing body lotion for men, enriched with saffron, niacinamide, vitamins, and long-lasting oudh fragrance.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Men''s Care','Dry Skin','Body Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'body-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Multi Solution Face Cream For Men') or slug = 'yara-multi-solution-face-cream-for-men' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Multi Solution Face Cream For Men', 'yara-multi-solution-face-cream-for-men', 'A daily face cream for men designed to hydrate, reduce dullness, control excess oil, and support smoother-looking skin.', v_category_id, 0, 0, 'YARA-YARA-MULT-SOLU-FACE', 0, 5, 'active', array['Deep hydration and moisturization','Helps reduce dark spots and uneven skin tone','Controls excess oil and shine','Improves skin texture and smoothness','Helps protect from environmental stressors','Suitable for daily use']::text[], 'Apply a small amount to clean face and neck. Massage gently until fully absorbed. Use morning and night for best results.', 'Deionized Water (Aqua), Mineral Oil, Glycerin, Kojic Acid, Alpha Arbutin, Vitamin C, Vitamin E, Licorice Decoction, Pomegranate Oil, Jojoba Oil, Shea Butter, Cocoa Butter, Lanolin, Petroleum Paraffin, Citric Acid, Essential Oil, Sodium Lauryl Sulfate (SLS), BHT, Germall Plus', 'For external use only. Avoid contact with eyes. If irritation occurs, discontinue use. Keep out of reach of children.', 'Men''s Skin Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 16', 'YARA Multi Solution Face Cream For Men | YARA Productions', 'A daily face cream for men designed to hydrate, reduce dullness, control excess oil, and support smoother-looking skin.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Multi Solution Face Cream For Men', slug = 'yara-multi-solution-face-cream-for-men', description = 'A daily face cream for men designed to hydrate, reduce dullness, control excess oil, and support smoother-looking skin.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-MULT-SOLU-FACE'), status = 'active', benefits = array['Deep hydration and moisturization','Helps reduce dark spots and uneven skin tone','Controls excess oil and shine','Improves skin texture and smoothness','Helps protect from environmental stressors','Suitable for daily use']::text[], how_to_use = 'Apply a small amount to clean face and neck. Massage gently until fully absorbed. Use morning and night for best results.', ingredients = 'Deionized Water (Aqua), Mineral Oil, Glycerin, Kojic Acid, Alpha Arbutin, Vitamin C, Vitamin E, Licorice Decoction, Pomegranate Oil, Jojoba Oil, Shea Butter, Cocoa Butter, Lanolin, Petroleum Paraffin, Citric Acid, Essential Oil, Sodium Lauryl Sulfate (SLS), BHT, Germall Plus', caution = 'For external use only. Avoid contact with eyes. If irritation occurs, discontinue use. Keep out of reach of children.', original_category = 'Men''s Skin Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 16', seo_title = 'YARA Multi Solution Face Cream For Men | YARA Productions', seo_description = 'A daily face cream for men designed to hydrate, reduce dullness, control excess oil, and support smoother-looking skin.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Men''s Care','Pigmentation','Dry Skin']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'hair-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Hair Oil') or slug = 'yara-hair-oil' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Hair Oil', 'yara-hair-oil', 'A fast-growing hair oil designed to nourish the scalp, reduce dandruff, support hair growth, and reduce dryness.', v_category_id, 0, 0, 'YARA-YARA-HAIR-OIL', 0, 5, 'active', array['Supports healthier-looking hair','Scalp comfort support','Helps reduce breakage','Supports damage','Nourishing and hydrating','Reduces frizz and dryness','Supports healthier-looking hair']::text[], 'Apply oil to the scalp, massage gently, cover with a towel or shower cap, and leave overnight. Wash with chemical-free shampoo the next day and dry.', '', 'For external use only. Avoid contact with eyes.', 'Hair, Lash & Brow Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 19', 'YARA Hair Oil | YARA Productions', 'A fast-growing hair oil designed to nourish the scalp, reduce dandruff, support hair growth, and reduce dryness.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Hair Oil', slug = 'yara-hair-oil', description = 'A fast-growing hair oil designed to nourish the scalp, reduce dandruff, support hair growth, and reduce dryness.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-HAIR-OIL'), status = 'active', benefits = array['Supports healthier-looking hair','Scalp comfort support','Helps reduce breakage','Supports damage','Nourishing and hydrating','Reduces frizz and dryness','Supports healthier-looking hair']::text[], how_to_use = 'Apply oil to the scalp, massage gently, cover with a towel or shower cap, and leave overnight. Wash with chemical-free shampoo the next day and dry.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Hair, Lash & Brow Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 19', seo_title = 'YARA Hair Oil | YARA Productions', seo_description = 'A fast-growing hair oil designed to nourish the scalp, reduce dandruff, support hair growth, and reduce dryness.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Hair Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'hair-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Hair Serum') or slug = 'yara-hair-serum' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Hair Serum', 'yara-hair-serum', 'A hair serum designed to strengthen hair, add shine, reduce frizz, and support healthier-looking hair.', v_category_id, 0, 0, 'YARA-YARA-HAIR-SERU', 0, 5, 'active', array['Strengthens hair','Reduces breakage','Promotes healthy hair growth','Nourishes scalp and reduces dryness','Adds shine and smoothness','Helps reduce frizz and split ends','Scalp comfort support']::text[], 'Apply a few drops to the scalp and hair, then massage gently. Can be used on dry or damp hair anytime. No rinse needed. Use daily or as needed.', '', 'For external use only. Avoid contact with eyes.', 'Hair, Lash & Brow Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 20', 'YARA Hair Serum | YARA Productions', 'A hair serum designed to strengthen hair, add shine, reduce frizz, and support healthier-looking hair.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Hair Serum', slug = 'yara-hair-serum', description = 'A hair serum designed to strengthen hair, add shine, reduce frizz, and support healthier-looking hair.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-HAIR-SERU'), status = 'active', benefits = array['Strengthens hair','Reduces breakage','Promotes healthy hair growth','Nourishes scalp and reduces dryness','Adds shine and smoothness','Helps reduce frizz and split ends','Scalp comfort support']::text[], how_to_use = 'Apply a few drops to the scalp and hair, then massage gently. Can be used on dry or damp hair anytime. No rinse needed. Use daily or as needed.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Hair, Lash & Brow Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 20', seo_title = 'YARA Hair Serum | YARA Productions', seo_description = 'A hair serum designed to strengthen hair, add shine, reduce frizz, and support healthier-looking hair.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Hair Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'combos-kits';
  select id into v_product_id from public.products where lower(name) = lower('YARA Hair Kit') or slug = 'yara-hair-kit' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Hair Kit', 'yara-hair-kit', 'A hair care kit with hair oil and rosemary serum to nourish scalp, strengthen roots, and support manageable hair.', v_category_id, 0, 0, 'YARA-YARA-HAIR-KIT', 0, 5, 'active', array['Nourishes scalp','Strengthens roots','Promotes healthy hair growth','Supports scalp comfort','Helps reduce the chance of breakage','Adds shine','Controls frizz','Leaves hair softer and more manageable']::text[], 'Apply hair oil to the scalp and massage gently. Leave it overnight. After washing, apply a few drops of rosemary serum to scalp and hair. No rinse needed. Use regularly.', '', 'For external use only.', 'Combos & Kits', 'Use PDF image first / replace later with clean product photo', 'PDF page 21', 'YARA Hair Kit | YARA Productions', 'A hair care kit with hair oil and rosemary serum to nourish scalp, strengthen roots, and support manageable hair.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Hair Kit', slug = 'yara-hair-kit', description = 'A hair care kit with hair oil and rosemary serum to nourish scalp, strengthen roots, and support manageable hair.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-HAIR-KIT'), status = 'active', benefits = array['Nourishes scalp','Strengthens roots','Promotes healthy hair growth','Supports scalp comfort','Helps reduce the chance of breakage','Adds shine','Controls frizz','Leaves hair softer and more manageable']::text[], how_to_use = 'Apply hair oil to the scalp and massage gently. Leave it overnight. After washing, apply a few drops of rosemary serum to scalp and hair. No rinse needed. Use regularly.', ingredients = '', caution = 'For external use only.', original_category = 'Combos & Kits', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 21', seo_title = 'YARA Hair Kit | YARA Productions', seo_description = 'A hair care kit with hair oil and rosemary serum to nourish scalp, strengthen roots, and support manageable hair.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Hair Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'hair-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Lash & Brow Conditioning Oil') or slug = 'yara-lash-brow-conditioning-oil' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Lash & Brow Conditioning Oil', 'yara-lash-brow-conditioning-oil', 'A gentle lash and brow conditioning oil that moisturizes and supports thicker-looking lashes and brows.', v_category_id, 0, 0, 'YARA-YARA-LASH-BROW-COND', 0, 5, 'active', array['Strengthens weak lashes and brows','Helps reduce breakage','Supports thicker-looking growth','Deeply moisturizes every strand','Gentle enough for everyday use']::text[], 'Apply a thin layer to clean eyelashes and eyebrows once daily.', 'Ricinus Communis (Castor) Seed Oil, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Simmondsia Chinensis (Jojoba) Seed Oil, Argania Spinosa Kernel Oil, Tocopherol (Vitamin E)', 'For external use only. Avoid direct contact with eyes. Discontinue use if irritation occurs.', 'Hair, Lash & Brow Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 22', 'YARA Lash & Brow Conditioning Oil | YARA Productions', 'A gentle lash and brow conditioning oil that moisturizes and supports thicker-looking lashes and brows.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Lash & Brow Conditioning Oil', slug = 'yara-lash-brow-conditioning-oil', description = 'A gentle lash and brow conditioning oil that moisturizes and supports thicker-looking lashes and brows.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-LASH-BROW-COND'), status = 'active', benefits = array['Strengthens weak lashes and brows','Helps reduce breakage','Supports thicker-looking growth','Deeply moisturizes every strand','Gentle enough for everyday use']::text[], how_to_use = 'Apply a thin layer to clean eyelashes and eyebrows once daily.', ingredients = 'Ricinus Communis (Castor) Seed Oil, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Simmondsia Chinensis (Jojoba) Seed Oil, Argania Spinosa Kernel Oil, Tocopherol (Vitamin E)', caution = 'For external use only. Avoid direct contact with eyes. Discontinue use if irritation occurs.', original_category = 'Hair, Lash & Brow Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 22', seo_title = 'YARA Lash & Brow Conditioning Oil | YARA Productions', seo_description = 'A gentle lash and brow conditioning oil that moisturizes and supports thicker-looking lashes and brows.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Hair Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'herbal-powders-face-packs';
  select id into v_product_id from public.products where lower(name) = lower('YARA Hibiscus Powder') or slug = 'yara-hibiscus-powder' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Hibiscus Powder', 'yara-hibiscus-powder', 'A multi-use hibiscus powder for face and hair care, supporting skin texture, pore cleansing, and stronger-looking hair.', v_category_id, 0, 0, 'YARA-YARA-HIBI-POWD', 0, 5, 'active', array['Unblocks and cleans pores','Improves skin tone and texture','Rich in antioxidants','Scalp comfort support','Increases hair volume','Makes hair soft and silky','Helps reduce the chance of hair graying','Strengthens hair']::text[], 'Face: Mix one tablespoon of hibiscus powder with one tablespoon of honey and apply all over face. Hair: Mix two tablespoons with hair oil, apply to scalp, leave for 15-20 minutes, and wash off.', 'Hibiscus powder', 'For external use only. Patch test before use.', 'Herbal Powders & Face Packs', 'Use PDF image first / replace later with clean product photo', 'PDF page 24', 'YARA Hibiscus Powder | YARA Productions', 'A multi-use hibiscus powder for face and hair care, supporting skin texture, pore cleansing, and stronger-looking hair.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Hibiscus Powder', slug = 'yara-hibiscus-powder', description = 'A multi-use hibiscus powder for face and hair care, supporting skin texture, pore cleansing, and stronger-looking hair.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-HIBI-POWD'), status = 'active', benefits = array['Unblocks and cleans pores','Improves skin tone and texture','Rich in antioxidants','Scalp comfort support','Increases hair volume','Makes hair soft and silky','Helps reduce the chance of hair graying','Strengthens hair']::text[], how_to_use = 'Face: Mix one tablespoon of hibiscus powder with one tablespoon of honey and apply all over face. Hair: Mix two tablespoons with hair oil, apply to scalp, leave for 15-20 minutes, and wash off.', ingredients = 'Hibiscus powder', caution = 'For external use only. Patch test before use.', original_category = 'Herbal Powders & Face Packs', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 24', seo_title = 'YARA Hibiscus Powder | YARA Productions', seo_description = 'A multi-use hibiscus powder for face and hair care, supporting skin texture, pore cleansing, and stronger-looking hair.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Pigmentation','Body Care','Hair Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'herbal-powders-face-packs';
  select id into v_product_id from public.products where lower(name) = lower('YARA Moroccan Nila Powder') or slug = 'yara-moroccan-nila-powder' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Moroccan Nila Powder', 'yara-moroccan-nila-powder', 'A Moroccan nila powder designed to brighten, soften, and support a naturally glowing skin appearance.', v_category_id, 0, 0, 'YARA-YARA-MORO-NILA-POWD', 0, 5, 'active', array['Helps improve the appearance of hyperpigmentation','Brightens and softens skin','Restores radiance','Reduces fine lines','Detoxifies and soothes irritation','Promotes natural glow','Helps support clearer-looking skin','Maintains moisture']::text[], 'Mix a small amount with rose water or yogurt to create a paste. Apply to the desired area, leave for 10-15 minutes, then gently wipe off with a damp cloth or paper towel.', 'Moroccan Nila Powder', 'For external use only. Patch test before use.', 'Herbal Powders & Face Packs', 'Use PDF image first / replace later with clean product photo', 'PDF page 25', 'YARA Moroccan Nila Powder | YARA Productions', 'A Moroccan nila powder designed to brighten, soften, and support a naturally glowing skin appearance.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Moroccan Nila Powder', slug = 'yara-moroccan-nila-powder', description = 'A Moroccan nila powder designed to brighten, soften, and support a naturally glowing skin appearance.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-MORO-NILA-POWD'), status = 'active', benefits = array['Helps improve the appearance of hyperpigmentation','Brightens and softens skin','Restores radiance','Reduces fine lines','Detoxifies and soothes irritation','Promotes natural glow','Helps support clearer-looking skin','Maintains moisture']::text[], how_to_use = 'Mix a small amount with rose water or yogurt to create a paste. Apply to the desired area, leave for 10-15 minutes, then gently wipe off with a damp cloth or paper towel.', ingredients = 'Moroccan Nila Powder', caution = 'For external use only. Patch test before use.', original_category = 'Herbal Powders & Face Packs', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 25', seo_title = 'YARA Moroccan Nila Powder | YARA Productions', seo_description = 'A Moroccan nila powder designed to brighten, soften, and support a naturally glowing skin appearance.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Pigmentation','Body Care','Acne Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'herbal-powders-face-packs';
  select id into v_product_id from public.products where lower(name) = lower('YARA Multani Mati Powder') or slug = 'yara-multani-mati-powder' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Multani Mati Powder', 'yara-multani-mati-powder', 'A natural cleansing powder that helps control oil, remove excess sebum, and keep skin soft and smooth.', v_category_id, 0, 0, 'YARA-YARA-MULT-MATI-POWD', 0, 5, 'active', array['Natural cleansing agent','Controls oil','Removes excess sebum and dirt','Helps improve the look of blemish-prone skin','Soothes sunburn and irritation','Makes skin soft and smooth','Adds glow']::text[], 'Mix Multani Mati with water for oily skin or milk for dry skin. Make a thin paste and apply on face. Keep for 20 minutes or until dry. Wash with warm water and rinse with cold water.', 'Multani Mati', 'For external use only. Patch test before use.', 'Herbal Powders & Face Packs', 'Use PDF image first / replace later with clean product photo', 'PDF page 26', 'YARA Multani Mati Powder | YARA Productions', 'A natural cleansing powder that helps control oil, remove excess sebum, and keep skin soft and smooth.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Multani Mati Powder', slug = 'yara-multani-mati-powder', description = 'A natural cleansing powder that helps control oil, remove excess sebum, and keep skin soft and smooth.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-MULT-MATI-POWD'), status = 'active', benefits = array['Natural cleansing agent','Controls oil','Removes excess sebum and dirt','Helps improve the look of blemish-prone skin','Soothes sunburn and irritation','Makes skin soft and smooth','Adds glow']::text[], how_to_use = 'Mix Multani Mati with water for oily skin or milk for dry skin. Make a thin paste and apply on face. Keep for 20 minutes or until dry. Wash with warm water and rinse with cold water.', ingredients = 'Multani Mati', caution = 'For external use only. Patch test before use.', original_category = 'Herbal Powders & Face Packs', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 26', seo_title = 'YARA Multani Mati Powder | YARA Productions', seo_description = 'A natural cleansing powder that helps control oil, remove excess sebum, and keep skin soft and smooth.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Acne Care','Brightening','Body Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'weight-loss-wellness';
  select id into v_product_id from public.products where lower(name) = lower('YARA Weight Loss Powder') or slug = 'yara-weight-loss-powder' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Weight Loss Powder', 'yara-weight-loss-powder', 'A wellness powder designed to support weight management, digestion, and daily detox routines.', v_category_id, 0, 0, 'YARA-YARA-WEIG-LOSS-POWD', 0, 5, 'active', array['Supports weight-management routines','Supports wellness and active lifestyle routines','Helps enhance metabolic rate','Supports daily wellness routines','Supports digestion','Supports digestive comfort']::text[], 'Take one spoon and mix with hot water before morning breakfast and after dinner.', 'Ginseng, Dry Ginger, Turmeric, Cinnamon, Cumin, Hibiscus, Green Tea Powder', 'Not medical advice. Consult a healthcare professional if pregnant, breastfeeding, under medication, or with health conditions.', 'Weight Loss / Wellness', 'Use PDF image first / replace later with clean product photo', 'PDF page 27', 'YARA Weight Loss Powder | YARA Productions', 'A wellness powder designed to support weight management, digestion, and daily detox routines.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Weight Loss Powder', slug = 'yara-weight-loss-powder', description = 'A wellness powder designed to support weight management, digestion, and daily detox routines.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-WEIG-LOSS-POWD'), status = 'active', benefits = array['Supports weight-management routines','Supports wellness and active lifestyle routines','Helps enhance metabolic rate','Supports daily wellness routines','Supports digestion','Supports digestive comfort']::text[], how_to_use = 'Take one spoon and mix with hot water before morning breakfast and after dinner.', ingredients = 'Ginseng, Dry Ginger, Turmeric, Cinnamon, Cumin, Hibiscus, Green Tea Powder', caution = 'Not medical advice. Consult a healthcare professional if pregnant, breastfeeding, under medication, or with health conditions.', original_category = 'Weight Loss / Wellness', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 27', seo_title = 'YARA Weight Loss Powder | YARA Productions', seo_description = 'A wellness powder designed to support weight management, digestion, and daily detox routines.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Wellness']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'herbal-powders-face-packs';
  select id into v_product_id from public.products where lower(name) = lower('YARA Herbal Kuliyal Powder') or slug = 'yara-herbal-kuliyal-powder' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Herbal Kuliyal Powder', 'yara-herbal-kuliyal-powder', 'A traditional herbal bathing powder that naturally cleanses, refreshes, and keeps skin soft and smooth.', v_category_id, 0, 0, 'YARA-YARA-HERB-KULI-POWD', 0, 5, 'active', array['Naturally cleanses skin','Helps keep skin soft and smooth','Refreshes and revitalizes','Suitable for daily use','Made with selected herbal ingredients']::text[], 'Mix the required amount with water, rose water, or milk to form a smooth paste. Apply gently to face and body, massage lightly, and rinse thoroughly with water.', 'Green Gram Powder, Rice Powder, Rose Petal Powder, Vetiver Powder, Kasturi Turmeric Powder, Sandalwood Powder, Manjistha Powder, Licorice Root Powder', 'For external use only. Avoid direct contact with eyes. Keep out of reach of children. Discontinue use if irritation occurs.', 'Herbal Powders & Face Packs', 'Use PDF image first / replace later with clean product photo', 'PDF page 28', 'YARA Herbal Kuliyal Powder | YARA Productions', 'A traditional herbal bathing powder that naturally cleanses, refreshes, and keeps skin soft and smooth.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Herbal Kuliyal Powder', slug = 'yara-herbal-kuliyal-powder', description = 'A traditional herbal bathing powder that naturally cleanses, refreshes, and keeps skin soft and smooth.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-HERB-KULI-POWD'), status = 'active', benefits = array['Naturally cleanses skin','Helps keep skin soft and smooth','Refreshes and revitalizes','Suitable for daily use','Made with selected herbal ingredients']::text[], how_to_use = 'Mix the required amount with water, rose water, or milk to form a smooth paste. Apply gently to face and body, massage lightly, and rinse thoroughly with water.', ingredients = 'Green Gram Powder, Rice Powder, Rose Petal Powder, Vetiver Powder, Kasturi Turmeric Powder, Sandalwood Powder, Manjistha Powder, Licorice Root Powder', caution = 'For external use only. Avoid direct contact with eyes. Keep out of reach of children. Discontinue use if irritation occurs.', original_category = 'Herbal Powders & Face Packs', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 28', seo_title = 'YARA Herbal Kuliyal Powder | YARA Productions', seo_description = 'A traditional herbal bathing powder that naturally cleanses, refreshes, and keeps skin soft and smooth.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Body Care','Brightening','Dry Skin']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Sun Gel') or slug = 'yara-sun-gel' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Sun Gel', 'yara-sun-gel', 'A lightweight sun gel that helps shield skin from UVA/UVB rays while giving a natural dewy glow.', v_category_id, 0, 0, 'YARA-YARA-SUN-GEL', 0, 5, 'active', array['Helps protect skin from UVA/UVB rays','Lightweight','Non-greasy','Quick absorbing','Helps reduce the chance of sunburn, tanning, and premature aging','Gel-based formula gives natural dewy glow']::text[], 'Apply a generous amount to face and exposed skin 15-20 minutes before sun exposure. Reapply every 2-3 hours if outdoors or after sweating or swimming.', '', 'For external use only. Avoid contact with eyes.', 'Sun Protection', 'Use PDF image first / replace later with clean product photo', 'PDF page 30', 'YARA Sun Gel | YARA Productions', 'A lightweight sun gel that helps shield skin from UVA/UVB rays while giving a natural dewy glow.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Sun Gel', slug = 'yara-sun-gel', description = 'A lightweight sun gel that helps shield skin from UVA/UVB rays while giving a natural dewy glow.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-SUN-GEL'), status = 'active', benefits = array['Helps protect skin from UVA/UVB rays','Lightweight','Non-greasy','Quick absorbing','Helps reduce the chance of sunburn, tanning, and premature aging','Gel-based formula gives natural dewy glow']::text[], how_to_use = 'Apply a generous amount to face and exposed skin 15-20 minutes before sun exposure. Reapply every 2-3 hours if outdoors or after sweating or swimming.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Sun Protection', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 30', seo_title = 'YARA Sun Gel | YARA Productions', seo_description = 'A lightweight sun gel that helps shield skin from UVA/UVB rays while giving a natural dewy glow.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Sun Protection','Men''s Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Sun Block Spray') or slug = 'yara-sun-block-spray' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Sun Block Spray', 'yara-sun-block-spray', 'A lightweight sun block spray designed for easy application and everyday sun protection.', v_category_id, 0, 0, 'YARA-YARA-SUN-BLOC-SPRA', 0, 5, 'active', array['Keeps skin healthy and radiant','Helps reduce the chance of premature aging','Lightweight','Non-greasy','Easy to apply']::text[], 'Apply evenly on exposed skin before sun exposure. Reapply as needed, especially when outdoors.', '', 'For external use only. Avoid spraying directly into eyes.', 'Sun Protection', 'Use PDF image first / replace later with clean product photo', 'PDF page 31', 'YARA Sun Block Spray | YARA Productions', 'A lightweight sun block spray designed for easy application and everyday sun protection.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Sun Block Spray', slug = 'yara-sun-block-spray', description = 'A lightweight sun block spray designed for easy application and everyday sun protection.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-SUN-BLOC-SPRA'), status = 'active', benefits = array['Keeps skin healthy and radiant','Helps reduce the chance of premature aging','Lightweight','Non-greasy','Easy to apply']::text[], how_to_use = 'Apply evenly on exposed skin before sun exposure. Reapply as needed, especially when outdoors.', ingredients = '', caution = 'For external use only. Avoid spraying directly into eyes.', original_category = 'Sun Protection', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 31', seo_title = 'YARA Sun Block Spray | YARA Productions', seo_description = 'A lightweight sun block spray designed for easy application and everyday sun protection.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Sun Protection','Body Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'soap-collection';
  select id into v_product_id from public.products where lower(name) = lower('YARA Nila Soap') or slug = 'yara-nila-soap' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Nila Soap', 'yara-nila-soap', 'A daily-use soap that helps brighten skin tone, remove oil and dirt, and keep skin smooth and soft.', v_category_id, 0, 0, 'YARA-YARA-NILA-SOAP', 0, 5, 'active', array['Brightens skin tone','Cooling effect','Removes oil and dirt','Smooth and soft skin','Helps with acne and pimples','Helps reduce the chance of body odor','Gentle for daily use']::text[], 'Apply on face and body, leave for 3 minutes, and wash off. Suitable for all skin types.', '', 'For external use only. Avoid contact with eyes.', 'Soap Collection', 'Use PDF image first / replace later with clean product photo', 'PDF page 33', 'YARA Nila Soap | YARA Productions', 'A daily-use soap that helps brighten skin tone, remove oil and dirt, and keep skin smooth and soft.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Nila Soap', slug = 'yara-nila-soap', description = 'A daily-use soap that helps brighten skin tone, remove oil and dirt, and keep skin smooth and soft.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-NILA-SOAP'), status = 'active', benefits = array['Brightens skin tone','Cooling effect','Removes oil and dirt','Smooth and soft skin','Helps with acne and pimples','Helps reduce the chance of body odor','Gentle for daily use']::text[], how_to_use = 'Apply on face and body, leave for 3 minutes, and wash off. Suitable for all skin types.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Soap Collection', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 33', seo_title = 'YARA Nila Soap | YARA Productions', seo_description = 'A daily-use soap that helps brighten skin tone, remove oil and dirt, and keep skin smooth and soft.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Body Care','Acne Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'soap-collection';
  select id into v_product_id from public.products where lower(name) = lower('YARA Papaya Soap') or slug = 'yara-papaya-soap' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Papaya Soap', 'yara-papaya-soap', 'A papaya soap designed to brighten, exfoliate, and leave skin clean, soft, and fresh.', v_category_id, 0, 0, 'YARA-YARA-PAPA-SOAP', 0, 5, 'active', array['Skin brightening','Natural exfoliation','Helps improve the appearance of dark spots and blemishes','Moisturizing and nourishing','Leaves skin clean, soft, and fresh','Improves skin texture','Helps brighten skin']::text[], 'Wet face or body, lather the soap in your hands, and gently massage onto skin in circular motions. Rinse thoroughly and pat dry. Use three times daily.', '', 'For external use only. Avoid contact with eyes.', 'Soap Collection', 'Use PDF image first / replace later with clean product photo', 'PDF page 34', 'YARA Papaya Soap | YARA Productions', 'A papaya soap designed to brighten, exfoliate, and leave skin clean, soft, and fresh.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Papaya Soap', slug = 'yara-papaya-soap', description = 'A papaya soap designed to brighten, exfoliate, and leave skin clean, soft, and fresh.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-PAPA-SOAP'), status = 'active', benefits = array['Skin brightening','Natural exfoliation','Helps improve the appearance of dark spots and blemishes','Moisturizing and nourishing','Leaves skin clean, soft, and fresh','Improves skin texture','Helps brighten skin']::text[], how_to_use = 'Wet face or body, lather the soap in your hands, and gently massage onto skin in circular motions. Rinse thoroughly and pat dry. Use three times daily.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Soap Collection', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 34', seo_title = 'YARA Papaya Soap | YARA Productions', seo_description = 'A papaya soap designed to brighten, exfoliate, and leave skin clean, soft, and fresh.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Body Care','Pigmentation']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'soap-collection';
  select id into v_product_id from public.products where lower(name) = lower('YARA Treatment Soap') or slug = 'yara-treatment-soap' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Treatment Soap', 'yara-treatment-soap', 'A treatment soap made to fight pimples, unclog pores, reduce excess oil, and support clearer-looking skin.', v_category_id, 0, 0, 'YARA-YARA-TREA-SOAP', 0, 5, 'active', array['Helps reduce pimples and acne','Unclogs pores','Removes excess oil','Reduces redness and inflammation','Helps reduce the chance of future breakouts','Helps support clearer-looking skin-causing bacteria','Promotes smoother, clearer skin','Supports and strengthens skin barrier']::text[], 'Wet face and body, lather the soap in your hands, apply foam to skin and leave for 3-4 minutes. Rinse thoroughly and pat dry. Use twice or three times daily.', '', 'For external use only. Avoid contact with eyes. Stop use if irritation occurs.', 'Soap Collection', 'Use PDF image first / replace later with clean product photo', 'PDF page 35', 'YARA Treatment Soap | YARA Productions', 'A treatment soap made to fight pimples, unclog pores, reduce excess oil, and support clearer-looking skin.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Treatment Soap', slug = 'yara-treatment-soap', description = 'A treatment soap made to fight pimples, unclog pores, reduce excess oil, and support clearer-looking skin.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-TREA-SOAP'), status = 'active', benefits = array['Helps reduce pimples and acne','Unclogs pores','Removes excess oil','Reduces redness and inflammation','Helps reduce the chance of future breakouts','Helps support clearer-looking skin-causing bacteria','Promotes smoother, clearer skin','Supports and strengthens skin barrier']::text[], how_to_use = 'Wet face and body, lather the soap in your hands, apply foam to skin and leave for 3-4 minutes. Rinse thoroughly and pat dry. Use twice or three times daily.', ingredients = '', caution = 'For external use only. Avoid contact with eyes. Stop use if irritation occurs.', original_category = 'Soap Collection', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 35', seo_title = 'YARA Treatment Soap | YARA Productions', seo_description = 'A treatment soap made to fight pimples, unclog pores, reduce excess oil, and support clearer-looking skin.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Acne Care','Brightening','Body Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'soap-collection';
  select id into v_product_id from public.products where lower(name) = lower('YARA Multani Mati Soap') or slug = 'yara-multani-mati-soap' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Multani Mati Soap', 'yara-multani-mati-soap', 'A Multani Mati soap that helps deep cleanse, control oil, brighten skin tone, and soothe irritation.', v_category_id, 0, 0, 'YARA-YARA-MULT-MATI-SOAP', 0, 5, 'active', array['Deep cleansing','Oil control','Helps reduce the chance of acne and pimples','Brightens skin tone','Soothes irritation','Tightens skin','Natural deodorizer','Chemical-free option']::text[], 'Apply on face and body, leave for 3 minutes, and wash off. Suitable for all skin types.', '', 'For external use only. Avoid contact with eyes.', 'Soap Collection', 'Use PDF image first / replace later with clean product photo', 'PDF page 36', 'YARA Multani Mati Soap | YARA Productions', 'A Multani Mati soap that helps deep cleanse, control oil, brighten skin tone, and soothe irritation.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Multani Mati Soap', slug = 'yara-multani-mati-soap', description = 'A Multani Mati soap that helps deep cleanse, control oil, brighten skin tone, and soothe irritation.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-MULT-MATI-SOAP'), status = 'active', benefits = array['Deep cleansing','Oil control','Helps reduce the chance of acne and pimples','Brightens skin tone','Soothes irritation','Tightens skin','Natural deodorizer','Chemical-free option']::text[], how_to_use = 'Apply on face and body, leave for 3 minutes, and wash off. Suitable for all skin types.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Soap Collection', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 36', seo_title = 'YARA Multani Mati Soap | YARA Productions', seo_description = 'A Multani Mati soap that helps deep cleanse, control oil, brighten skin tone, and soothe irritation.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Acne Care','Body Care','Brightening']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'soap-collection';
  select id into v_product_id from public.products where lower(name) = lower('YARA Saffron Booster Soap') or slug = 'yara-saffron-booster-soap' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Saffron Booster Soap', 'yara-saffron-booster-soap', 'A saffron booster soap made to brighten, hydrate, and reduce the appearance of blemishes and hyperpigmentation.', v_category_id, 0, 0, 'YARA-YARA-SAFF-BOOS-SOAP', 0, 5, 'active', array['Helps brighten skin','Brightens skin','Hydrates','Supports glowing skin','Helps soothe wounds','Helps improve the appearance of marks','Helps improve hyperpigmentation','Reduces blemishes']::text[], 'Wet face and body, lather in your hands, apply foam and leave for 3-4 minutes. Rinse thoroughly and pat dry. Use twice or three times daily.', '', 'For external use only. Avoid contact with eyes.', 'Soap Collection', 'Use PDF image first / replace later with clean product photo', 'PDF page 37', 'YARA Saffron Booster Soap | YARA Productions', 'A saffron booster soap made to brighten, hydrate, and reduce the appearance of blemishes and hyperpigmentation.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Saffron Booster Soap', slug = 'yara-saffron-booster-soap', description = 'A saffron booster soap made to brighten, hydrate, and reduce the appearance of blemishes and hyperpigmentation.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-SAFF-BOOS-SOAP'), status = 'active', benefits = array['Helps brighten skin','Brightens skin','Hydrates','Supports glowing skin','Helps soothe wounds','Helps improve the appearance of marks','Helps improve hyperpigmentation','Reduces blemishes']::text[], how_to_use = 'Wet face and body, lather in your hands, apply foam and leave for 3-4 minutes. Rinse thoroughly and pat dry. Use twice or three times daily.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Soap Collection', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 37', seo_title = 'YARA Saffron Booster Soap | YARA Productions', seo_description = 'A saffron booster soap made to brighten, hydrate, and reduce the appearance of blemishes and hyperpigmentation.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Pigmentation','Body Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'soap-collection';
  select id into v_product_id from public.products where lower(name) = lower('YARA Oats Soap') or slug = 'yara-oats-soap' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Oats Soap', 'yara-oats-soap', 'An oats soap designed to gently exfoliate, unclog pores, reduce pigmentation, and leave skin soft and fresh.', v_category_id, 0, 0, 'YARA-YARA-OATS-SOAP', 0, 5, 'active', array['Controls excess oil and shine','Gently exfoliates and unclogs pores','Soothes irritated skin','Helps reduce the chance of breakouts','Leaves skin clean, soft, and fresh','Helps reduce the appearance of pigmentation','Helps brighten skin']::text[], 'Wet face or body, lather the soap in your hands, and massage onto skin in circular motions. Rinse thoroughly and pat dry. Use three times daily.', '', 'For external use only. Avoid contact with eyes.', 'Soap Collection', 'Use PDF image first / replace later with clean product photo', 'PDF page 38', 'YARA Oats Soap | YARA Productions', 'An oats soap designed to gently exfoliate, unclog pores, reduce pigmentation, and leave skin soft and fresh.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Oats Soap', slug = 'yara-oats-soap', description = 'An oats soap designed to gently exfoliate, unclog pores, reduce pigmentation, and leave skin soft and fresh.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-OATS-SOAP'), status = 'active', benefits = array['Controls excess oil and shine','Gently exfoliates and unclogs pores','Soothes irritated skin','Helps reduce the chance of breakouts','Leaves skin clean, soft, and fresh','Helps reduce the appearance of pigmentation','Helps brighten skin']::text[], how_to_use = 'Wet face or body, lather the soap in your hands, and massage onto skin in circular motions. Rinse thoroughly and pat dry. Use three times daily.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Soap Collection', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 38', seo_title = 'YARA Oats Soap | YARA Productions', seo_description = 'An oats soap designed to gently exfoliate, unclog pores, reduce pigmentation, and leave skin soft and fresh.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Acne Care','Body Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'supplements';
  select id into v_product_id from public.products where lower(name) = lower('YARA Iran Original Saffron') or slug = 'yara-iran-original-saffron' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Iran Original Saffron', 'yara-iran-original-saffron', 'Original saffron used as a wellness ingredient to support radiance, glow, and a fresh-looking complexion.', v_category_id, 0, 0, 'YARA-YARA-IRAN-ORIG-SAFF', 0, 5, 'active', array['Enhances natural radiance','Rich in antioxidants','Supports even skin tone','Reduces dullness','Supports smoother-looking skin','Helps soothe sensitive skin','Supports refreshed complexion','Maintains skin elasticity','Promotes luminous look']::text[], 'Take 7 strands of saffron and place them in 1 litre of water. Let sit for 20 minutes until the color changes. Once infused, drink anytime during the day.', 'Iran Original Saffron', 'Consult a healthcare professional if pregnant, breastfeeding, or under medication.', 'Supplements / Saffron', 'Use PDF image first / replace later with clean product photo', 'PDF page 40', 'YARA Iran Original Saffron | YARA Productions', 'Original saffron used as a wellness ingredient to support radiance, glow, and a fresh-looking complexion.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Iran Original Saffron', slug = 'yara-iran-original-saffron', description = 'Original saffron used as a wellness ingredient to support radiance, glow, and a fresh-looking complexion.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-IRAN-ORIG-SAFF'), status = 'active', benefits = array['Enhances natural radiance','Rich in antioxidants','Supports even skin tone','Reduces dullness','Supports smoother-looking skin','Helps soothe sensitive skin','Supports refreshed complexion','Maintains skin elasticity','Promotes luminous look']::text[], how_to_use = 'Take 7 strands of saffron and place them in 1 litre of water. Let sit for 20 minutes until the color changes. Once infused, drink anytime during the day.', ingredients = 'Iran Original Saffron', caution = 'Consult a healthcare professional if pregnant, breastfeeding, or under medication.', original_category = 'Supplements / Saffron', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 40', seo_title = 'YARA Iran Original Saffron | YARA Productions', seo_description = 'Original saffron used as a wellness ingredient to support radiance, glow, and a fresh-looking complexion.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Anti-Aging','Wellness']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'body-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Body Oil') or slug = 'yara-body-oil' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Body Oil', 'yara-body-oil', 'A body oil that hydrates, softens, and supports glowing-looking skin while helping reduce dryness.', v_category_id, 0, 0, 'YARA-YARA-BODY-OIL', 0, 5, 'active', array['High level of antioxidants','Reduces stretch marks','Helps soothe eczema','Makes skin glow','Softens and hydrates','Eases muscle tension','Fresh fragrance','Reduces dryness']::text[], 'Massage well until fully absorbed into the skin. Use daily for maximum benefits.', '', 'For external use only. Patch test before use.', 'Body Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 41', 'YARA Body Oil | YARA Productions', 'A body oil that hydrates, softens, and supports glowing-looking skin while helping reduce dryness.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Body Oil', slug = 'yara-body-oil', description = 'A body oil that hydrates, softens, and supports glowing-looking skin while helping reduce dryness.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-BODY-OIL'), status = 'active', benefits = array['High level of antioxidants','Reduces stretch marks','Helps soothe eczema','Makes skin glow','Softens and hydrates','Eases muscle tension','Fresh fragrance','Reduces dryness']::text[], how_to_use = 'Massage well until fully absorbed into the skin. Use daily for maximum benefits.', ingredients = '', caution = 'For external use only. Patch test before use.', original_category = 'Body Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 41', seo_title = 'YARA Body Oil | YARA Productions', seo_description = 'A body oil that hydrates, softens, and supports glowing-looking skin while helping reduce dryness.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Dry Skin','Body Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Saffron Gold Gel') or slug = 'yara-saffron-gold-gel' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Saffron Gold Gel', 'yara-saffron-gold-gel', 'A saffron gold gel that moisturizes, brightens, controls oil, and supports a glassy skin look.', v_category_id, 0, 0, 'YARA-YARA-SAFF-GOLD-GEL', 0, 5, 'active', array['Gives glassy Korean skin','Reduces fine lines and wrinkles','Controls oil','Stimulates cell renewal and supports skin','Helps brighten pigmentation','Helps improve the appearance of blemishes','Helps manage excess oil and blemish-prone skin','Moisturizes and brightens']::text[], 'Take a pea-sized amount of saffron gel. Massage in circular motions until fully absorbed. Use twice daily for best results.', '', 'For external use only. Avoid contact with eyes.', 'Face Gel', 'Use PDF image first / replace later with clean product photo', 'PDF page 42', 'YARA Saffron Gold Gel | YARA Productions', 'A saffron gold gel that moisturizes, brightens, controls oil, and supports a glassy skin look.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Saffron Gold Gel', slug = 'yara-saffron-gold-gel', description = 'A saffron gold gel that moisturizes, brightens, controls oil, and supports a glassy skin look.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-SAFF-GOLD-GEL'), status = 'active', benefits = array['Gives glassy Korean skin','Reduces fine lines and wrinkles','Controls oil','Stimulates cell renewal and supports skin','Helps brighten pigmentation','Helps improve the appearance of blemishes','Helps manage excess oil and blemish-prone skin','Moisturizes and brightens']::text[], how_to_use = 'Take a pea-sized amount of saffron gel. Massage in circular motions until fully absorbed. Use twice daily for best results.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Face Gel', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 42', seo_title = 'YARA Saffron Gold Gel | YARA Productions', seo_description = 'A saffron gold gel that moisturizes, brightens, controls oil, and supports a glassy skin look.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Acne Care','Dry Skin','Pigmentation','Sun Protection']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'supplements';
  select id into v_product_id from public.products where lower(name) = lower('YARA Phyto Booster') or slug = 'yara-phyto-booster' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Phyto Booster', 'yara-phyto-booster', 'A brightening support booster supplement designed to support brightening, hydration, smooth texture, and skin elasticity.', v_category_id, 0, 0, 'YARA-YARA-PHYT-BOOS', 0, 5, 'active', array['Brightening','Brightening support','Anti-aging','Anti-acne support','Deep hydration','Smooth texture','Boosts energy','Skin elasticity']::text[], 'Mix 1 scoop in 150ml water. Take in the morning before breakfast or at night before bed.', '', 'Consult a healthcare professional before use if pregnant, breastfeeding, under medication, or with health conditions.', 'Supplements', 'Use PDF image first / replace later with clean product photo', 'PDF page 44', 'YARA Phyto Booster | YARA Productions', 'A brightening support booster supplement designed to support brightening, hydration, smooth texture, and skin elasticity.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Phyto Booster', slug = 'yara-phyto-booster', description = 'A brightening support booster supplement designed to support brightening, hydration, smooth texture, and skin elasticity.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-PHYT-BOOS'), status = 'active', benefits = array['Brightening','Brightening support','Anti-aging','Anti-acne support','Deep hydration','Smooth texture','Boosts energy','Skin elasticity']::text[], how_to_use = 'Mix 1 scoop in 150ml water. Take in the morning before breakfast or at night before bed.', ingredients = '', caution = 'Consult a healthcare professional before use if pregnant, breastfeeding, under medication, or with health conditions.', original_category = 'Supplements', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 44', seo_title = 'YARA Phyto Booster | YARA Productions', seo_description = 'A brightening support booster supplement designed to support brightening, hydration, smooth texture, and skin elasticity.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Anti-Aging','Wellness']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'supplements';
  select id into v_product_id from public.products where lower(name) = lower('YARA Colly Capsules') or slug = 'yara-colly-capsules' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Colly Capsules', 'yara-colly-capsules', 'A glutathione capsule supplement designed to support skin brightening, firmness, and collagen boost.', v_category_id, 0, 0, 'YARA-YARA-COLL-CAPS', 0, 5, 'active', array['Supports brighter-looking skin','Anti-aging','Wrinkle reduction','Helps improve the appearance of spots and pigmentation','Skin firming','Collagen boost','Helps support clearer-looking skin','Supports damaged skin']::text[], 'Take one capsule daily before bed.', '', 'Consult a healthcare professional before use if pregnant, breastfeeding, under medication, or with health conditions.', 'Supplements', 'Use PDF image first / replace later with clean product photo', 'PDF page 45', 'YARA Colly Capsules | YARA Productions', 'A glutathione capsule supplement designed to support skin brightening, firmness, and collagen boost.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Colly Capsules', slug = 'yara-colly-capsules', description = 'A glutathione capsule supplement designed to support skin brightening, firmness, and collagen boost.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-COLL-CAPS'), status = 'active', benefits = array['Supports brighter-looking skin','Anti-aging','Wrinkle reduction','Helps improve the appearance of spots and pigmentation','Skin firming','Collagen boost','Helps support clearer-looking skin','Supports damaged skin']::text[], how_to_use = 'Take one capsule daily before bed.', ingredients = '', caution = 'Consult a healthcare professional before use if pregnant, breastfeeding, under medication, or with health conditions.', original_category = 'Supplements', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 45', seo_title = 'YARA Colly Capsules | YARA Productions', seo_description = 'A glutathione capsule supplement designed to support skin brightening, firmness, and collagen boost.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Anti-Aging','Wellness']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'face-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Peel-Off Mask') or slug = 'yara-peel-off-mask' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Peel-Off Mask', 'yara-peel-off-mask', 'A peel-off mask that helps remove dead skin, blackheads, and excess oil while leaving skin fresh and smooth.', v_category_id, 0, 0, 'YARA-YARA-PEEL-OFF-MASK', 0, 5, 'active', array['Lightening and brightening support','Helps improve the appearance of dark spots','Firms skin and reduces fine lines','Leaves skin fresh, smooth, and rejuvenated','Helps brighten facial hair for smoother look','Removes dead skin, blackheads, and excess oil']::text[], 'Cleanse face, apply an even layer avoiding sensitive areas, let dry for 15-20 minutes, peel off gently from the bottom, then rinse and moisturize.', '', 'Avoid sensitive areas and eyes. Patch test before use. Discontinue if irritation occurs.', 'Face Masks & Packs', 'Use PDF image first / replace later with clean product photo', 'PDF page 46', 'YARA Peel-Off Mask | YARA Productions', 'A peel-off mask that helps remove dead skin, blackheads, and excess oil while leaving skin fresh and smooth.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Peel-Off Mask', slug = 'yara-peel-off-mask', description = 'A peel-off mask that helps remove dead skin, blackheads, and excess oil while leaving skin fresh and smooth.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-PEEL-OFF-MASK'), status = 'active', benefits = array['Lightening and brightening support','Helps improve the appearance of dark spots','Firms skin and reduces fine lines','Leaves skin fresh, smooth, and rejuvenated','Helps brighten facial hair for smoother look','Removes dead skin, blackheads, and excess oil']::text[], how_to_use = 'Cleanse face, apply an even layer avoiding sensitive areas, let dry for 15-20 minutes, peel off gently from the bottom, then rinse and moisturize.', ingredients = '', caution = 'Avoid sensitive areas and eyes. Patch test before use. Discontinue if irritation occurs.', original_category = 'Face Masks & Packs', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 46', seo_title = 'YARA Peel-Off Mask | YARA Productions', seo_description = 'A peel-off mask that helps remove dead skin, blackheads, and excess oil while leaving skin fresh and smooth.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Acne Care','Brightening']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'body-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Stretch Marks Cream') or slug = 'yara-stretch-marks-cream' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Stretch Marks Cream', 'yara-stretch-marks-cream', 'A stretch marks cream made to moisturize, improve elasticity, and smooth rough or stretched skin.', v_category_id, 0, 0, 'YARA-YARA-STRE-MARK-CREA', 0, 5, 'active', array['Helps fade existing stretch marks','Improves skin elasticity and firmness','Deeply moisturizes and nourishes','Reduces dryness and itchiness','Smooths and softens rough or stretched skin']::text[], 'Apply a small amount to clean, dry skin on affected areas. Massage in circular motions until absorbed. Use twice daily, morning and night, for best results.', '', 'For external use only. Avoid contact with eyes.', 'Body Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 47', 'YARA Stretch Marks Cream | YARA Productions', 'A stretch marks cream made to moisturize, improve elasticity, and smooth rough or stretched skin.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Stretch Marks Cream', slug = 'yara-stretch-marks-cream', description = 'A stretch marks cream made to moisturize, improve elasticity, and smooth rough or stretched skin.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-STRE-MARK-CREA'), status = 'active', benefits = array['Helps fade existing stretch marks','Improves skin elasticity and firmness','Deeply moisturizes and nourishes','Reduces dryness and itchiness','Smooths and softens rough or stretched skin']::text[], how_to_use = 'Apply a small amount to clean, dry skin on affected areas. Massage in circular motions until absorbed. Use twice daily, morning and night, for best results.', ingredients = '', caution = 'For external use only. Avoid contact with eyes.', original_category = 'Body Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 47', seo_title = 'YARA Stretch Marks Cream | YARA Productions', seo_description = 'A stretch marks cream made to moisturize, improve elasticity, and smooth rough or stretched skin.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Body Care','Dry Skin','Anti-Aging']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'lip-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Lip Scrub') or slug = 'yara-lip-scrub' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Lip Scrub', 'yara-lip-scrub', 'A lip scrub that exfoliates dead skin and supports softer, smoother, and healthier-looking lips.', v_category_id, 0, 0, 'YARA-YARA-LIP-SCRU', 0, 5, 'active', array['Reduces tanning and darkness','Exfoliates dead skin','Rejuvenates','Hydrates','Nourishes','Softens','Smooths','Promotes plumper lips']::text[], 'Gently massage onto lips, exfoliate for one minute, rinse off, and apply lip balm for hydration.', '', 'For external use only. Do not use on broken or irritated lips.', 'Lip Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 49', 'YARA Lip Scrub | YARA Productions', 'A lip scrub that exfoliates dead skin and supports softer, smoother, and healthier-looking lips.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Lip Scrub', slug = 'yara-lip-scrub', description = 'A lip scrub that exfoliates dead skin and supports softer, smoother, and healthier-looking lips.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-LIP-SCRU'), status = 'active', benefits = array['Reduces tanning and darkness','Exfoliates dead skin','Rejuvenates','Hydrates','Nourishes','Softens','Smooths','Promotes plumper lips']::text[], how_to_use = 'Gently massage onto lips, exfoliate for one minute, rinse off, and apply lip balm for hydration.', ingredients = '', caution = 'For external use only. Do not use on broken or irritated lips.', original_category = 'Lip Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 49', seo_title = 'YARA Lip Scrub | YARA Productions', seo_description = 'A lip scrub that exfoliates dead skin and supports softer, smoother, and healthier-looking lips.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Lip Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;

  select id into v_category_id from public.categories where slug = 'lip-care';
  select id into v_product_id from public.products where lower(name) = lower('YARA Lip Balm') or slug = 'yara-lip-balm' limit 1;
  if v_product_id is null then
    insert into public.products (name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status, benefits, how_to_use, ingredients, caution, original_category, image_status, pdf_source_page, seo_title, seo_description)
    values ('YARA Lip Balm', 'yara-lip-balm', 'A moisturizing lip balm that helps protect, brighten, and repair dry or chapped lips.', v_category_id, 0, 0, 'YARA-YARA-LIP-BALM', 0, 5, 'active', array['Smooth plump lips','Helps reduce the appearance of pigmentation','Protects from UV rays','Brightens','Supports dry and chapped lips','Deep moisture']::text[], 'Apply a thin, even layer to clean lips and reapply as needed to keep lips moisturized and protected.', '', 'For external use only. Discontinue use if irritation occurs.', 'Lip Care', 'Use PDF image first / replace later with clean product photo', 'PDF page 50', 'YARA Lip Balm | YARA Productions', 'A moisturizing lip balm that helps protect, brighten, and repair dry or chapped lips.')
    returning id into v_product_id;
  else
    update public.products set
      name = 'YARA Lip Balm', slug = 'yara-lip-balm', description = 'A moisturizing lip balm that helps protect, brighten, and repair dry or chapped lips.', category_id = v_category_id, sku = coalesce(nullif(sku, ''), 'YARA-YARA-LIP-BALM'), status = 'active', benefits = array['Smooth plump lips','Helps reduce the appearance of pigmentation','Protects from UV rays','Brightens','Supports dry and chapped lips','Deep moisture']::text[], how_to_use = 'Apply a thin, even layer to clean lips and reapply as needed to keep lips moisturized and protected.', ingredients = '', caution = 'For external use only. Discontinue use if irritation occurs.', original_category = 'Lip Care', image_status = 'Use PDF image first / replace later with clean product photo', pdf_source_page = 'PDF page 50', seo_title = 'YARA Lip Balm | YARA Productions', seo_description = 'A moisturizing lip balm that helps protect, brighten, and repair dry or chapped lips.'
    where id = v_product_id;
  end if;
  delete from public.product_skin_concerns where product_id = v_product_id;
  foreach v_concern in array array['Lip Care']::text[]
  loop
    insert into public.product_skin_concerns(product_id, skin_concern_id)
    select v_product_id, id from public.skin_concerns where name = v_concern
    on conflict do nothing;
  end loop;
end $$;
