# Payment verification report

Status: Unable to Verify / Partially Available.

Evidence:

- `src/app/api/checkout/route.ts` validates PayHere environment-variable presence, creates a server-side hash and posts the configured fields.
- `src/app/api/payhere/notify/route.ts` handles provider callbacks through the existing payment RPC.
- `src/lib/payhere.ts` contains the PayHere configuration and hash logic.
- `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, `PAYHERE_SANDBOX`, `PAYHERE_APP_ID` and related public URL variables are referenced by code or examples; values were not exposed.

Repository checks cannot prove the merchant account supports AED, nor can they prove valid/invalid callbacks, duplicate callbacks, wrong amount/currency, failed payment stock release or a provider-confirmed refund without safe sandbox credentials. No live payment was initiated. UAE PayHere compatibility remains a release gate.
