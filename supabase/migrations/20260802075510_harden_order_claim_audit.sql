create index if not exists order_claim_audit_claimed_by_user_idx
  on public.order_claim_audit(claimed_by_user_id, created_at desc);

-- The audit table is intentionally service-role-only. An explicit deny policy
-- documents that no browser role may read or write audit records.
drop policy if exists order_claim_audit_deny_client on public.order_claim_audit;
create policy order_claim_audit_deny_client
  on public.order_claim_audit for all
  to anon, authenticated
  using (false)
  with check (false);
