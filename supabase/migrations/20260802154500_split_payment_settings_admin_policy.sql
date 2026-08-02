-- Keep admin reads separate from admin writes so the Performance Advisor does
-- not evaluate two permissive SELECT policies for authenticated users.
drop policy if exists payment_method_settings_admin_write on public.payment_method_settings;

create policy payment_method_settings_admin_insert
  on public.payment_method_settings
  for insert to authenticated
  with check ((select private.is_admin()));

create policy payment_method_settings_admin_update
  on public.payment_method_settings
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy payment_method_settings_admin_delete
  on public.payment_method_settings
  for delete to authenticated
  using ((select private.is_admin()));
