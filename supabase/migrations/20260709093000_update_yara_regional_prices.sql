-- Latest UAE and Sri Lanka price catalog update.
-- Keeps existing product copy, categories, skin concerns, stock, image, status, and SEO data intact.

with price_updates(slug, match_names, price_lkr, price_aed) as (
  values
    ('yara-alpha-arbutin-cleanser', array['YARA Alpha Arbutin Cleanser', 'Alpha Arbutin Pinkish Face Cleanser']::text[], 3000::numeric, 50::numeric),
    ('yara-alpha-arbutin-serum', array['YARA Alpha Arbutin Serum', 'Alpha Arbutin Pinkish Serum']::text[], 3000, 35),
    ('yara-pinkish-night-cream', array['YARA Pinkish Night Cream', 'YARA Night Cream', 'Pinkish Night Cream']::text[], 4000, 50),
    ('yara-body-lotion', array['YARA Body Lotion', 'Whitening Pinkish Body Lotion 100G', 'Whitening Body Lotion 100G']::text[], 3000, 60),
    ('yara-saffron-face-wash', array['YARA Saffron Face Wash', 'Saffron Face Wash', 'Saffron Face Wash (Niacinamide)']::text[], 3000, 50),
    ('yara-saffron-serum', array['YARA Saffron Serum', 'Saffron Niacinamide Serum']::text[], 3000, 35),
    ('yara-day-cream', array['YARA Day Cream', 'Whitening Day Cream']::text[], 4000, 50),
    ('yara-vip-face-cream', array['YARA VIP Face Cream', 'VIP Whitening Face Cream']::text[], 12500, 125),
    ('yara-vip-body-lotion', array['YARA VIP Body Lotion', 'VIP Whitening Body Cream', 'VIP Whitening Body Lotion']::text[], 12500, 125),
    ('yara-vip-kit', array['YARA VIP Kit', 'VIP Face Cream + VIP Body Cream Combo']::text[], 25000, 250),
    ('yara-multi-solution-body-lotion-for-men', array['YARA Multi Solution Body Lotion For Men', 'YARA Multi Solution Body Lotion', 'Men''s Whitening Body Lotion']::text[], 3000, 40),
    ('yara-multi-solution-face-cream-for-men', array['YARA Multi Solution Face Cream For Men', 'YARA Multi Solution Face Cream']::text[], 4000, 50),
    ('yara-hair-oil', array['YARA Hair Oil', 'Herbal Fast Grow Hair Oil']::text[], 2500, 60),
    ('yara-hair-serum', array['YARA Hair Serum', 'Hair Serum']::text[], 3000, 50),
    ('yara-lash-brow-conditioning-oil', array['YARA Lash & Brow Conditioning Oil', 'Eye Lash Growing Oil', 'Lash & Brow Conditioning Oil']::text[], 1999, 35),
    ('yara-hibiscus-powder', array['YARA Hibiscus Powder', 'Hibiscus Whitening Pack', 'Hibiscus Powder']::text[], 1999, 40),
    ('yara-moroccan-nila-powder', array['YARA Moroccan Nila Powder', 'Moroccan Nila Powder']::text[], 1999, 40),
    ('yara-multani-mati-powder', array['YARA Multani Mati Powder', 'Multani Mati Powder']::text[], 1000, 20),
    ('yara-weight-loss-powder', array['YARA Weight Loss Powder']::text[], 3000, 40),
    ('yara-herbal-kuliyal-powder', array['YARA Herbal Kuliyal Powder', 'Bathing Powder', 'Kuliyal Powder', 'Bathing Powder (Kuliyal Powder)']::text[], 1999, 30),
    ('yara-sun-gel', array['YARA Sun Gel', 'Sunscreen Protection Gel']::text[], 2500, 40),
    ('yara-sun-block-spray', array['YARA Sun Block Spray', 'Sun Spray', 'Sun Block Spray']::text[], 3000, 40),
    ('yara-nila-soap', array['YARA Nila Soap', 'Nila Powder Soap']::text[], 1999, 30),
    ('yara-papaya-soap', array['YARA Papaya Soap', 'Whitening Papaya Soap']::text[], 1000, 20),
    ('yara-treatment-soap', array['YARA Treatment Soap', 'Acne & Pimple Treatment Soap']::text[], 1000, 30),
    ('yara-multani-mati-soap', array['YARA Multani Mati Soap', 'Multan Soap', 'Multani Soap']::text[], 1999, 30),
    ('yara-saffron-booster-soap', array['YARA Saffron Booster Soap', 'Saffron Kojic Booster Soap', 'YARA Booster Soap']::text[], 2500, 40),
    ('yara-oats-soap', array['YARA Oats Soap', 'Whitening Oats Soap']::text[], 1000, 20),
    ('yara-iran-original-saffron', array['YARA Iran Original Saffron', 'IRAN Original Saffron']::text[], 2500, 30),
    ('yara-body-oil', array['YARA Body Oil', 'Body Oil']::text[], 3000, 50),
    ('yara-saffron-gold-gel', array['YARA Saffron Gold Gel', 'Saffron Face Gel']::text[], 3000, 50),
    ('yara-phyto-booster', array['YARA Phyto Booster', 'Phyto Collagen Whitening Booster']::text[], 9000, 120),
    ('yara-colly-capsules', array['YARA Colly Capsules', 'Colly Glutathione Capsules']::text[], 10000, 150),
    ('yara-peel-off-mask', array['YARA Peel-Off Mask', 'Peel Off Mask']::text[], 1999, 40),
    ('yara-stretch-marks-cream', array['YARA Stretch Marks Cream', 'Stretch Mark Cream']::text[], 5000, 50),
    ('yara-lip-scrub', array['YARA Lip Scrub', 'Lip Scrub']::text[], 1500, 20),
    ('yara-lip-balm', array['YARA Lip Balm', 'Lip Balm']::text[], 1500, 20)
)
update public.products as product
set
  price_lkr = price_updates.price_lkr,
  price_aed = price_updates.price_aed
from price_updates
where product.slug = price_updates.slug
  or exists (
    select 1
    from unnest(price_updates.match_names) as alias(name)
    where lower(product.name) = lower(alias.name)
  );

do $$
declare
  v_product_id uuid;
  v_category_id uuid;
  v_concern text;
  v_seed record;
begin
  for v_seed in
    select *
    from (values
      (
        'YARA Whitening Pinkish Body Lotion 200G',
        'yara-whitening-pinkish-body-lotion-200g',
        'Body Care',
        6000::numeric,
        95::numeric,
        'YARA-WHIT-PINK-BODY-200G',
        'A larger-size body lotion that hydrates skin and supports a smoother, brighter-looking body glow.',
        array['Helps moisturize dry skin', 'Supports a smoother-looking body glow', 'Fast-absorbing daily body care']::text[],
        'Massage into clean body skin using circular motions. Use daily or as directed on the product packaging.',
        'For external use only. Discontinue use if irritation occurs.',
        'Body Care',
        'YARA Whitening Pinkish Body Lotion 200G | YARA Productions',
        'Shop YARA Whitening Pinkish Body Lotion 200G for daily body hydration and a smoother, brighter-looking glow.',
        array['Body Care', 'Dry Skin', 'Brightening']::text[]
      ),
      (
        'YARA Day & Night Cream Combo',
        'yara-day-night-cream-combo',
        'Combos & Kits',
        7000::numeric,
        90::numeric,
        'YARA-DAY-NIGH-COMB',
        'A day and night cream combo created for a complete morning and evening face-care routine.',
        array['Combines day and night face care', 'Supports a brighter-looking complexion', 'Helps maintain a consistent routine']::text[],
        'Use the day cream in the morning and the night cream in the evening after cleansing.',
        'For external use only. Avoid contact with eyes. Patch test before use.',
        'Combos & Kits',
        'YARA Day & Night Cream Combo | YARA Productions',
        'Shop the YARA Day & Night Cream Combo for a complete morning and evening skincare routine.',
        array['Brightening', 'Pigmentation', 'Anti-Aging']::text[]
      ),
      (
        'YARA Manjistha Soap',
        'yara-manjistha-soap',
        'Soap Collection',
        1000::numeric,
        25::numeric,
        'YARA-MANJ-SOAP',
        'A manjistha soap for gentle cleansing and a refreshed, brighter-looking skin appearance.',
        array['Gently cleanses skin', 'Supports a refreshed skin feel', 'Helps improve the appearance of dullness']::text[],
        'Lather with water, massage onto face or body, then rinse thoroughly. Avoid the eye area.',
        'For external use only. Avoid contact with eyes. Discontinue use if irritation occurs.',
        'Soap Collection',
        'YARA Manjistha Soap | YARA Productions',
        'Shop YARA Manjistha Soap for gentle daily cleansing and brighter-looking skin.',
        array['Brightening', 'Pigmentation', 'Body Care']::text[]
      ),
      (
        'YARA Whitening Face Mask Sheet',
        'yara-whitening-face-mask-sheet',
        'Face Care',
        1000::numeric,
        15::numeric,
        'YARA-WHIT-MASK-SHEE',
        'A single-use face mask sheet that supports a fresh, hydrated, brighter-looking complexion.',
        array['Supports hydrated skin', 'Promotes a fresh-looking glow', 'Easy single-use face care']::text[],
        'Apply to clean skin, leave on as directed on the package, then remove and gently pat in remaining essence.',
        'For external use only. Avoid contact with eyes. Discontinue use if irritation occurs.',
        'Face Care',
        'YARA Whitening Face Mask Sheet | YARA Productions',
        'Shop YARA Whitening Face Mask Sheet for a fresh, hydrated, brighter-looking complexion.',
        array['Brightening', 'Dry Skin']::text[]
      ),
      (
        'YARA Akkar Fassi',
        'yara-akkar-fassi',
        'Lip Care',
        1500::numeric,
        20::numeric,
        'YARA-AKKA-FASS',
        'Akkar Fassi color care for lips and beauty routines, made for a naturally tinted look.',
        array['Supports a naturally tinted look', 'Works well in lip care routines', 'Compact beauty essential']::text[],
        'Use a small amount as directed on the product packaging. Avoid broken or irritated skin.',
        'For external use only. Patch test before use. Discontinue use if irritation occurs.',
        'Lip Care',
        'YARA Akkar Fassi | YARA Productions',
        'Shop YARA Akkar Fassi for naturally tinted lip and beauty care routines.',
        array['Lip Care', 'Brightening']::text[]
      )
    ) as seed(name, slug, category_name, price_lkr, price_aed, sku, description, benefits, how_to_use, caution, original_category, seo_title, seo_description, concerns)
  loop
    select id into v_category_id
    from public.categories
    where name = v_seed.category_name
    limit 1;

    if v_category_id is null then
      raise exception 'Missing category for price catalog product: %', v_seed.category_name;
    end if;

    select id into v_product_id
    from public.products
    where slug = v_seed.slug or lower(name) = lower(v_seed.name)
    limit 1;

    if v_product_id is null then
      insert into public.products (
        name,
        slug,
        description,
        category_id,
        price_lkr,
        price_aed,
        sku,
        stock_quantity,
        low_stock_alert,
        status,
        benefits,
        how_to_use,
        ingredients,
        caution,
        original_category,
        image_status,
        pdf_source_page,
        seo_title,
        seo_description
      )
      values (
        v_seed.name,
        v_seed.slug,
        v_seed.description,
        v_category_id,
        v_seed.price_lkr,
        v_seed.price_aed,
        v_seed.sku,
        0,
        5,
        'active',
        v_seed.benefits,
        v_seed.how_to_use,
        '',
        v_seed.caution,
        v_seed.original_category,
        'Placeholder image / upload real product photo from admin',
        'Latest price catalog',
        v_seed.seo_title,
        v_seed.seo_description
      )
      returning id into v_product_id;
    else
      update public.products
      set
        price_lkr = v_seed.price_lkr,
        price_aed = v_seed.price_aed
      where id = v_product_id;
    end if;

    delete from public.product_skin_concerns
    where product_id = v_product_id;

    foreach v_concern in array v_seed.concerns
    loop
      insert into public.product_skin_concerns(product_id, skin_concern_id)
      select v_product_id, id
      from public.skin_concerns
      where name = v_concern
      on conflict do nothing;
    end loop;
  end loop;
end $$;
