# Production release checklist

## Source and verification

- [x] Canonical checkout: `/Users/usmanfahim08/Documents/GitHub/yaraproduction`
- [x] Work branch: `agent/final-launch-readiness`
- [x] Supabase project: `yhywklzutqzwafulnpcu`
- [x] No `.env`, `.next`, secret key, or service-role value committed
- [x] TypeScript passes
- [x] Automated tests pass
- [x] Production build passes
- [x] Additive migration drift reconciliation applied
- [ ] Full fresh-database migration replay passes
- [ ] Formal security scan complete
- [ ] All storefront/admin mobile and desktop flows pass
- [ ] Transactional provider delivery is verified

## Supabase leaked-password protection

This setting is **not currently enabled**. It is a manual dashboard action and
must not be marked complete until the security advisor clears.

1. Open Supabase project `yhywklzutqzwafulnpcu`.
2. Go to **Authentication → Settings → Password security**.
3. Set the minimum password length to at least 8.
4. Select the strongest available required-character policy.
5. Enable **Prevent use of leaked passwords**.
6. Save, then rerun the Supabase Security Advisor.
7. Verify that `auth_leaked_password_protection` no longer appears.

Leaked-password protection requires an eligible Supabase plan. If the toggle is
unavailable, upgrade or obtain the required plan before production launch.

## Transactional email

- [x] Official Resend Node.js SDK is pinned and used only by server code.
- [x] `.env.local` is ignored and no Resend secret is tracked.
- [x] Notification events, bounded retries, provider IDs, safe error categories,
      and delivery attempts are persisted with RLS.
- [x] Admin-only test endpoint is restricted to authorized configured addresses.
- [ ] Confirm customer order confirmation arrives at an authorized test inbox.
- [ ] Confirm admin new-order notification arrives.
- [ ] Confirm sender name/domain and reply-to behavior.
- [ ] Confirm mobile inbox rendering.
- [ ] Confirm a repeated checkout request creates no duplicate email.
- [ ] Confirm successful delivery in the Resend dashboard.

## Release decision

Do not deploy until every unchecked non-payment gate is verified and the final
security scan is complete.
