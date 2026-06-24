drop policy if exists "Active categories are public" on public.categories;
drop policy if exists "Active products are public" on public.products;

create policy "Public view active categories" on public.categories for select to anon, authenticated
using (status = 'active');
create policy "Staff view all categories" on public.categories for select to authenticated
using ((select private.is_staff()));

create policy "Public view active products" on public.products for select to anon, authenticated
using (status = 'active');
create policy "Staff view all products" on public.products for select to authenticated
using ((select private.is_staff()));
