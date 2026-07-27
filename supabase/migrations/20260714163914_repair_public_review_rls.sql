-- Anonymous requests cannot execute private.is_staff(). Keep public reads in
-- their own policy and reserve the staff predicate for authenticated users.
drop policy if exists "Published product reviews are public" on public.product_reviews;
drop policy if exists "Published product reviews are public (anon)" on public.product_reviews;
drop policy if exists "Published product reviews are public (authenticated)" on public.product_reviews;
create policy "Published product reviews are public (anon)" on public.product_reviews for select to anon
using (status = 'published');
create policy "Published product reviews are public (authenticated)" on public.product_reviews for select to authenticated
using (status = 'published' or (select private.is_staff()));

drop policy if exists "Published review images are public" on public.product_review_images;
drop policy if exists "Published review images are public (anon)" on public.product_review_images;
drop policy if exists "Published review images are public (authenticated)" on public.product_review_images;
create policy "Published review images are public (anon)" on public.product_review_images for select to anon
using (exists (select 1 from public.product_reviews r where r.id = review_id and r.status = 'published'));
create policy "Published review images are public (authenticated)" on public.product_review_images for select to authenticated
using (exists (select 1 from public.product_reviews r where r.id = review_id and (r.status = 'published' or (select private.is_staff()))));

notify pgrst, 'reload schema';
