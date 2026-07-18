# Security fix report

## Confirmed issue fixed

### Unauthenticated order-status disclosure

Before the change, `src/app/api/orders/[id]/route.ts` accepted any UUID and used the privileged Supabase client to return order status, currency, total, and order number. There was no authentication or ownership proof.

Fix: `src/lib/order-tracking.ts` signs `${orderId}:${orderNumber}` with server-only `ORDER_TRACKING_SECRET`. Checkout carries the token to the payment result/cancel URL, and the API requires a valid token before returning the safe status projection. Invalid and missing tokens return the same 404 response as an unknown order.

## Confirmed operational safety fix

The admin status action previously updated `orders` directly. It now calls a guarded RPC that authorizes the staff actor, validates lifecycle transitions, records an event/note, and restores reserved stock once when cancelling an order.

## Live security verification

- RLS was enabled on the new `order_events` table.
- The admin transition RPC uses `SECURITY DEFINER` and `SET search_path TO ''`.
- Supabase security advisor no longer reports public execution for the new RPC after grant repair.
- The remaining advisor warning is Supabase Auth leaked-password protection being disabled; this requires a dashboard configuration change and was not changed automatically.

## Not claimed as verified

Rate limiting, CAPTCHA, two-factor authentication, session expiry policy, backup/restore, production cookie configuration, Vercel environment protections, and live PayHere signature replay behavior require deployment/provider access and safe external tests.
