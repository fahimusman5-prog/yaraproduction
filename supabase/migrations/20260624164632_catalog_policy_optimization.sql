drop policy if exists "Public view active categories" on public.categories;
drop policy if exists "Staff view all categories" on public.categories;
drop policy if exists "Public view active products" on public.products;
drop policy if exists "Staff view all products" on public.products;

create policy "Anonymous view active categories" on public.categories for select to anon
using (status = 'active');
create policy "Authenticated view allowed categories" on public.categories for select to authenticated
using (status = 'active' or (select private.is_staff()));
create policy "Anonymous view active products" on public.products for select to anon
using (status = 'active');
create policy "Authenticated view allowed products" on public.products for select to authenticated
using (status = 'active' or (select private.is_staff()));
