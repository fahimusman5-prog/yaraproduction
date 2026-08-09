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
PAYHERE_ENABLED=true
PAYHERE_SANDBOX=true
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
NEXT_PUBLIC_SITE_URL=https://www.yaraproduct.com
```

`PAYHERE_SANDBOX` is the only mode selector. Set it to `false` in Vercel
Production for approved live credentials, which selects
`https://www.payhere.lk/pay/checkout`. Set it to `true` only with sandbox
credentials, which selects `https://sandbox.payhere.lk/pay/checkout`.
`PAYHERE_MODE` is not required or read by the application.

`PAYHERE_ENABLED=false` is an emergency provider kill switch. It does not hide
the regionally enabled Card Payment option; checkout reports the controlled
configuration error and COD/bank transfer remain independently configurable.

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
function.

## Testing checklist

1. Run `npm run typecheck`, `npm test`, and `npm run build`.
2. With PayHere disabled or credentials absent, confirm Card Payment remains
   visible, initiation returns a safe configuration error, and COD/bank
   transfer remain usable.
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
