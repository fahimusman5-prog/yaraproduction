-- Consolidate equivalent customer/staff access paths so PostgreSQL evaluates
-- one policy per role/action while preserving the existing access model.

drop policy if exists account_deletion_customer_insert on public.account_deletion_requests;
drop policy if exists account_deletion_customer_select on public.account_deletion_requests;
drop policy if exists account_deletion_customer_cancel on public.account_deletion_requests;
drop policy if exists account_deletion_staff_manage on public.account_deletion_requests;

create policy account_deletion_customer_staff_insert
  on public.account_deletion_requests
  for insert to authenticated
  with check (
    (((select auth.uid()) = user_id) and status = 'pending')
    or (select private.is_staff())
  );

create policy account_deletion_customer_staff_select
  on public.account_deletion_requests
  for select to authenticated
  using (
    ((select auth.uid()) = user_id)
    or (select private.is_staff())
  );

create policy account_deletion_customer_staff_update
  on public.account_deletion_requests
  for update to authenticated
  using (
    (
      (select auth.uid()) = user_id
      and status = 'pending'
      and now() <= cancellable_until
    )
    or (select private.is_staff())
  )
  with check (
    (
      (select auth.uid()) = user_id
      and status = 'cancelled'
    )
    or (select private.is_staff())
  );

create policy account_deletion_staff_delete
  on public.account_deletion_requests
  for delete to authenticated
  using ((select private.is_staff()));

-- These reads are served by server routes using the service role. Keep the
-- direct public read path for anonymous storefront requests, without adding a
-- second authenticated policy that overlaps the admin policy.
drop policy if exists delivery_settings_public_read_active on public.delivery_settings;
create policy delivery_settings_public_read_active
  on public.delivery_settings
  for select to anon
  using (is_enabled and is_configured);

drop policy if exists payment_method_settings_public_read_enabled on public.payment_method_settings;
create policy payment_method_settings_public_read_enabled
  on public.payment_method_settings
  for select to anon
  using (is_enabled);

drop policy if exists "Published review images are public (authenticated)" on public.product_review_images;
drop policy if exists "Staff manage review images" on public.product_review_images;

create policy product_review_images_published_or_staff_select
  on public.product_review_images
  for select to authenticated
  using (
    (exists (
      select 1
      from public.product_reviews r
      where r.id = product_review_images.review_id
        and r.status = 'published'
    ))
    or (select private.is_staff())
  );

create policy product_review_images_staff_insert
  on public.product_review_images
  for insert to authenticated
  with check ((select private.is_staff()));

create policy product_review_images_staff_update
  on public.product_review_images
  for update to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

create policy product_review_images_staff_delete
  on public.product_review_images
  for delete to authenticated
  using ((select private.is_staff()));

drop policy if exists "Customers submit own hidden reviews" on public.product_reviews;
drop policy if exists "Customers view own reviews" on public.product_reviews;
drop policy if exists "Published product reviews are public (authenticated)" on public.product_reviews;
drop policy if exists "Staff manage product reviews" on public.product_reviews;

create policy product_reviews_customer_staff_insert
  on public.product_reviews
  for insert to authenticated
  with check (
    (
      (select auth.uid()) = customer_user_id
      and status = 'hidden'
    )
    or (select private.is_staff())
  );

create policy product_reviews_customer_staff_select
  on public.product_reviews
  for select to authenticated
  using (
    status = 'published'
    or (select auth.uid()) = customer_user_id
    or (select private.is_staff())
  );

create policy product_reviews_staff_update
  on public.product_reviews
  for update to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

create policy product_reviews_staff_delete
  on public.product_reviews
  for delete to authenticated
  using ((select private.is_staff()));

drop policy if exists return_items_customer_select on public.return_items;
drop policy if exists staff_read_return_items on public.return_items;
create policy return_items_customer_or_staff_select
  on public.return_items
  for select to authenticated
  using (
    (exists (
      select 1
      from public.return_requests r
      where r.id = return_items.return_request_id
        and r.customer_user_id = (select auth.uid())
    ))
    or (select private.is_staff())
  );

drop policy if exists return_requests_customer_select on public.return_requests;
drop policy if exists staff_read_return_requests on public.return_requests;
create policy return_requests_customer_or_staff_select
  on public.return_requests
  for select to authenticated
  using (
    ((select auth.uid()) = customer_user_id)
    or (select private.is_staff())
  );

drop policy if exists return_status_history_customer_select on public.return_status_history;
drop policy if exists staff_read_return_status_history on public.return_status_history;
create policy return_status_history_customer_or_staff_select
  on public.return_status_history
  for select to authenticated
  using (
    (exists (
      select 1
      from public.return_requests r
      where r.id = return_status_history.return_request_id
        and r.customer_user_id = (select auth.uid())
    ))
    or (select private.is_staff())
  );
