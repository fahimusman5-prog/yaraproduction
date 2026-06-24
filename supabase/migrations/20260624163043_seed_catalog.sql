insert into public.categories(name, slug, status) values
  ('Skincare', 'skincare', 'active'),
  ('Haircare', 'haircare', 'active'),
  ('Body Care', 'body-care', 'active'),
  ('Gift Sets', 'gift-sets', 'active')
on conflict (slug) do update set name = excluded.name, status = excluded.status;

insert into public.products(name, slug, description, category_id, price_lkr, price_aed, sku, stock_quantity, low_stock_alert, status)
select seed.name, seed.slug, seed.description, categories.id, seed.price_lkr, seed.price_aed, seed.sku, 0, 5, 'active'
from (values
  ('YARA Saffron Face Wash', 'saffron-face-wash', 'A saffron and aloe daily cleanser that removes impurities while preserving the skin barrier.', 'skincare', 3500::numeric, 45::numeric, 'YARA-SFW-100'),
  ('YARA Night Cream', 'night-repair-cream', 'A rich overnight peptide treatment that supports renewal and lasting hydration.', 'skincare', 4500, 60, 'YARA-NC-050'),
  ('YARA Alpha Arbutin Serum', 'alpha-arbutin-serum', 'A daily serum for dark spots, uneven tone, and post-blemish marks.', 'skincare', 5500, 70, 'YARA-AAS-030'),
  ('YARA VIP Body Lotion', 'vip-body-lotion', 'A silk-finish body lotion with ceramides and floral oils.', 'body-care', 6500, 85, 'YARA-VBL-200'),
  ('YARA Hair Oil', 'botanical-hair-oil', 'A concentrated botanical oil that smooths dry ends and restores shine.', 'haircare', 4800, 65, 'YARA-HO-050'),
  ('YARA Lash & Brow Conditioning Oil', 'lash-brow-oil', 'A gentle conditioning oil for softer, healthier-looking lashes and brows.', 'haircare', 3200, 40, 'YARA-LBO-010'),
  ('Rosehip Glow Serum', 'rosehip-glow-serum', 'A rosehip and squalane concentrate that replenishes stressed skin.', 'skincare', 3900, 50, 'YARA-RGS-030'),
  ('Jasmine Facial Mist', 'jasmine-facial-mist', 'A jasmine and aloe mist that refreshes and restores a dewy finish.', 'skincare', 2800, 35, 'YARA-JFM-100'),
  ('The Glow Collection', 'the-glow-collection', 'A gift-ready five-piece edit of YARA essentials.', 'gift-sets', 12500, 165, 'YARA-GC-005')
) as seed(name, slug, description, category_slug, price_lkr, price_aed, sku)
join public.categories on categories.slug = seed.category_slug
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category_id = excluded.category_id,
  price_lkr = excluded.price_lkr,
  price_aed = excluded.price_aed,
  sku = excluded.sku,
  status = excluded.status;
