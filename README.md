# YARA Commerce

YARA is a Next.js storefront with an isolated Supabase-powered administration panel and point-of-sale system.

## Local development

Requirements: Node.js 24 and npm.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Open:

- Storefront: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- POS: `http://localhost:3000/pos`

The storefront, admin, POS, orders, inventory, and payments use Supabase.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
SUPABASE_SECRET_KEY=sb_secret_your_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_merchant_secret
PAYHERE_SANDBOX=true

# Optional storefront overrides
NEXT_PUBLIC_WHATSAPP_NUMBER_SRI_LANKA=94741266855
NEXT_PUBLIC_WHATSAPP_NUMBER_UAE=971543702924
```

`SUPABASE_SECRET_KEY` and PayHere credentials are server-only. Never add them to a `NEXT_PUBLIC_` variable.

## Supabase setup

1. Create a Supabase project.
2. Link the Supabase CLI and run `supabase db push` so every migration is applied in order.
3. Confirm that the `product-images` Storage bucket exists. The migration creates it and its staff-only write policies.
4. Create the first staff user in Authentication > Users.
5. Promote that user with the SQL below, replacing the email:

```sql
insert into public.profiles (id, email, full_name, role)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', ''), 'admin'
from auth.users
where email = 'owner@example.com'
on conflict (id) do update set role = 'admin';
```

Additional users default to the `customer` role. Change a trusted account to `staff` or `admin` from the SQL editor. Authorization decisions use the protected `profiles.role` column, not user-editable auth metadata.

The migrations include Data API grants, RLS, Storage policies, role enforcement, transactional storefront/POS checkout, stock history, and PayHere payment reconciliation.

## PayHere setup

1. Add the merchant ID and merchant secret to local and Vercel environment variables.
2. Keep `PAYHERE_SANDBOX=true` while testing; set it to `false` only for approved production credentials.
3. Set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS production origin.
4. Confirm the merchant account accepts every enabled currency. LKR and AED prices are stored separately and never converted by the app.

## Commands

```bash
npm run typecheck
npm run build
npm start
```

## Architecture

- `src/modules/admin` — admin UI, reads, validation, and server actions
- `src/modules/pos` — POS terminal, receipt flow, and protected sale action
- `src/app/admin` — thin App Router route files importing the admin module
- `src/app/pos` — thin App Router route files importing the POS module
- `supabase/migrations` — database schema, RLS, Storage, and transactional functions

The existing customer UI remains intact while its catalog, regional prices, stock, orders, and checkout are supplied by Supabase and PayHere.
