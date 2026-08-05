# YARA transactional email

YARA sends transactional email through the official Resend Node.js SDK. Provider
calls live in `src/lib/email.ts` and must remain server-only.

## Environment

Configure these server-side variables in local and deployment environments:

```dotenv
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
ADMIN_NOTIFICATION_EMAIL=
```

`EMAIL_FROM` accepts either `orders@yaraproduct.com` or a friendly sender such as
`YARA Productions <orders@yaraproduct.com>`. The sender domain must already be
verified in Resend. `EMAIL_REPLY_TO` and `ADMIN_NOTIFICATION_EMAIL` must be plain,
valid email addresses.

Never prefix the API key with `NEXT_PUBLIC_`. Never paste its value into source,
logs, screenshots, issue descriptions, or support messages. Local values belong
in `.env.local`, which is ignored by Git.

## Safe test

`POST /api/admin/email/test` is restricted to authenticated administrators. It
accepts one of two destinations:

```json
{ "destination": "self" }
```

or:

```json
{ "destination": "admin" }
```

The route does not accept an arbitrary address. `self` uses the authenticated
administrator's address; `admin` uses `ADMIN_NOTIFICATION_EMAIL`.

After a successful request:

1. Confirm the message is received at the authorized address.
2. Confirm the visible sender is the configured YARA name and verified domain.
3. Reply and confirm the response is addressed to `EMAIL_REPLY_TO`.
4. Inspect the message on a narrow mobile viewport.
5. Confirm the returned provider email ID appears in the Resend dashboard.
6. Confirm the matching `notification_events` and
   `notification_delivery_attempts` records show `sent`.

An API acceptance response is not proof of inbox delivery. Record live delivery
as passed only after the recipient and Resend dashboard both confirm it.

## Delivery behavior

- Checkout email deduplication uses the persisted order ID, template, and
  recipient, so an idempotent checkout retry cannot create another send.
- Temporary network, rate-limit, and provider failures retry at most three times
  with bounded backoff.
- Invalid recipients, invalid senders, and authentication failures are permanent
  and do not retry indefinitely.
- Order and status mutations complete independently of email delivery.
- Persisted audit records contain metadata and safe error categories, not the API
  key or rendered email body.
- Payment templates are present but remain disconnected until verified provider
  events are implemented.
