create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  rating smallint not null check (rating between 1 and 5),
  description text not null check (char_length(description) between 2 and 800),
  status text not null default 'hidden' check (status in ('published', 'hidden')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_product_status_sort_idx on public.product_reviews(product_id, status, sort_order, created_at desc);
create index if not exists product_reviews_status_idx on public.product_reviews(status);
create index if not exists product_review_images_review_sort_idx on public.product_review_images(review_id, sort_order);

create or replace function private.product_review_image_count(p_review_id uuid)
returns integer language sql stable security invoker set search_path = '' as $$
  select count(*)::integer from public.product_review_images where review_id = p_review_id;
$$;
revoke all on function private.product_review_image_count(uuid) from public;

create or replace function private.enforce_published_product_review_images()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare image_count integer;
begin
  if new.status = 'published' then
    image_count := private.product_review_image_count(new.id);
    if image_count < 3 or image_count > 5 then
      raise exception 'Published reviews must have between 3 and 5 images.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_published_product_review_images() from public;

drop trigger if exists product_reviews_require_images_before_publish on public.product_reviews;
create trigger product_reviews_require_images_before_publish
before insert or update of status on public.product_reviews
for each row execute procedure private.enforce_published_product_review_images();

drop trigger if exists product_reviews_set_updated_at on public.product_reviews;
create trigger product_reviews_set_updated_at
before update on public.product_reviews
for each row execute procedure private.set_updated_at();

alter table public.product_reviews enable row level security;
alter table public.product_review_images enable row level security;

drop policy if exists "Published product reviews are public" on public.product_reviews;
create policy "Published product reviews are public" on public.product_reviews for select to anon, authenticated
using (status = 'published' or (select private.is_staff()));
drop policy if exists "Staff manage product reviews" on public.product_reviews;
create policy "Staff manage product reviews" on public.product_reviews for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));

drop policy if exists "Published review images are public" on public.product_review_images;
create policy "Published review images are public" on public.product_review_images for select to anon, authenticated
using (exists (select 1 from public.product_reviews r where r.id = review_id and (r.status = 'published' or (select private.is_staff()))));
drop policy if exists "Staff manage review images" on public.product_review_images;
create policy "Staff manage review images" on public.product_review_images for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));

grant select on public.product_reviews, public.product_review_images to anon, authenticated;
grant select, insert, update, delete on public.product_reviews, public.product_review_images to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-reviews', 'product-reviews', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff upload product review images" on storage.objects;
create policy "Staff upload product review images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-reviews' and (select private.is_staff()));
drop policy if exists "Staff update product review images" on storage.objects;
create policy "Staff update product review images" on storage.objects for update to authenticated
using (bucket_id = 'product-reviews' and (select private.is_staff()))
with check (bucket_id = 'product-reviews' and (select private.is_staff()));
drop policy if exists "Staff delete product review images" on storage.objects;
create policy "Staff delete product review images" on storage.objects for delete to authenticated
using (bucket_id = 'product-reviews' and (select private.is_staff()));

notify pgrst, 'reload schema';
