create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.categories, public.products, public.orders, public.order_items, public.pos_sales, public.pos_sale_items, public.stock_movements to authenticated;

drop policy if exists "Admin insert products" on public.products;
drop policy if exists "Admin update products" on public.products;
drop policy if exists "Admin delete products" on public.products;

create policy "Admin insert products" on public.products for insert to authenticated
with check ((select private.is_admin()));

create policy "Admin update products" on public.products for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admin delete products" on public.products for delete to authenticated
using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Staff upload product images" on storage.objects;
drop policy if exists "Staff update product images" on storage.objects;
drop policy if exists "Staff delete product images" on storage.objects;

create policy "Public read product images" on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

create policy "Staff upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select private.is_staff()));

create policy "Staff update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select private.is_staff()))
with check (bucket_id = 'product-images' and (select private.is_staff()));

create policy "Staff delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select private.is_staff()));
