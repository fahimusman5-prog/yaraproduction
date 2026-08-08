# PayHere setup and testing

## Architecture

PayHere is a hosted card checkout. The browser submits only a server-created
payment contract. Product prices, coupons, delivery, processing fees, order
currency, exchange rate, and PayHere amount are recalculated and persisted by
the server/database.

Sri Lankan orders are accounted for and charged in LKR. UAE orders remain
accounted for in AED; the final AED total is converted once, server-side, to
LKR for PayHere. The exact rate and rounded LKR amount are snapshotted on the
payment attempt. PayHere never receives AED or USD.

## Environment variables

Set these server-side in local `.env.local` and Vercel. Never use
`NEXT_PUBLIC_` for private values.

```text
PAYHERE_ENABLED=false
PAYHERE_SANDBOX=true
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
NEXT_PUBLIC_SITE_URL=https://www.yaraproduct.com
```

The existing `PAYMENTS_ENABLED` variable remains supported for compatibility;
`PAYHERE_ENABLED=true` is the preferred switch. Leave PayHere disabled until
credentials and the business-approved rate are ready. COD and bank transfer
remain independently configurable.

Vercel environment values are strings. The server accepts `true`, `TRUE`, or
`1` for enabled flags (and `false`, `FALSE`, or `0` for disabled flags). Set
the variables in the **Production** environment and redeploy; Preview values
do not change the live site. The Merchant Secret is server-only and must never
be renamed with a `NEXT_PUBLIC_` prefix.

PayHere Live setup is domain-specific: Merchant Portal → Integrations → Add
Domain/App → add `yaraproduct.com` → request approval → copy the Merchant
Secret issued for that approved domain/app. Sandbox and Live Merchant IDs and
secrets are separate; do not mix them. Confirm the production origin is
`https://yaraproduct.com` and that PayHere allows the notify URL below.

## Rate management

An administrator creates an AED→LKR rate in Admin → Commerce. New rates are
append-only; the previous active rate is deactivated and retained for history.
The rate must be effective now, active, positive, and unexpired. Do not use a
public live FX feed without explicit business approval.

## URLs

Configure these URLs in the PayHere merchant dashboard after deployment:

- Notify: `https://www.yaraproduct.com/api/payments/payhere/notify`
- Return: `https://www.yaraproduct.com/payment/success`
- Cancel: `https://www.yaraproduct.com/payment/failure`

The notify endpoint accepts PayHere form posts, verifies the merchant
signature, amount, and LKR currency, then finalises payment idempotently.
Browser returns never mark an order paid.

## Migration and deployment

Apply `supabase/migrations/20260803060146_payhere_aed_lkr_only.sql` using the
approved Supabase migration workflow. It deactivates legacy active USD rates
without deleting historical records and installs the LKR-only preparation
function. Then deploy/redeploy with PayHere disabled until the environment and
rate are configured.

## Testing checklist

1. Run `npm run typecheck`, `npm test`, and `npm run build`.
2. With PayHere disabled or credentials absent, confirm card is unavailable
   with a safe message and COD/bank transfer remain usable.
3. In sandbox, test one Sri Lankan order and one UAE order. Confirm the UAE
   disclosure shows AED subtotal, discount, shipping, processing fee, total,
   rate, and exact LKR charge before redirect.
4. Replay a success notification and confirm no duplicate stock movement,
   email, notification, analytics, or order finalisation occurs.
5. Test pending, cancelled, failed, invalid-signature, wrong-amount, and
   wrong-currency notifications.
6. Complete a live low-value test only after merchant approval and callback
   allowlisting are confirmed.

## Disable and rollback

Set `PAYHERE_ENABLED=false` and redeploy. This disables only card checkout;
COD and bank transfer are not disabled. Do not delete payment attempts or
historical USD records. If a migration must be rolled back, use the approved
forward migration process and preserve immutable payment snapshots.
