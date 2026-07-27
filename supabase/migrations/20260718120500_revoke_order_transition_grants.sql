revoke execute on function public.update_admin_order_status(uuid, text, text, uuid, text) from anon, authenticated, public;
grant execute on function public.update_admin_order_status(uuid, text, text, uuid, text) to service_role;
