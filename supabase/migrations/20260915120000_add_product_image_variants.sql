-- Backward-compatible product image metadata. Existing image_url values remain
-- valid and are not rewritten by this migration.
alter table public.products
  add column if not exists original_image_url text,
  add column if not exists image_card_url text,
  add column if not exists image_thumbnail_url text;

comment on column public.products.original_image_url is
  'Immutable master upload. Never used for normal storefront rendering.';
comment on column public.products.image_card_url is
  'Responsive product-card WebP derivative, normally up to 800px.';
comment on column public.products.image_thumbnail_url is
  'Small WebP derivative, normally up to 320px, for cart/admin contexts.';

notify pgrst, 'reload schema';
