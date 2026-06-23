# YARA Commerce

YARA is a Next.js storefront with an isolated Supabase-powered administration panel and point-of-sale system.

## Local development

Requirements: Node.js 22 or newer and npm.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Open:

- Storefront: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- POS: `http://localhost:3000/pos`

The customer storefront runs without Supabase. Admin and POS require the environment variables below.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key

# Optional storefront overrides
NEXT_PUBLIC_WHATSAPP_NUMBER_SRI_LANKA=94741266855
NEXT_PUBLIC_WHATSAPP_NUMBER_UAE=971543702924
```

Use a Supabase publishable key in the browser. Never add a service role or secret key to a `NEXT_PUBLIC_` variable.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/20260623153000_admin_pos_mvp.sql`, or link the Supabase CLI and run `supabase db push`.
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

The migration includes explicit Data API grants, Row Level Security policies, product-image policies, and protected transactional database functions for stock adjustments and POS checkout.

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

The existing customer pages remain separate and continue using their current static product catalog. Connecting the storefront catalog and checkout to Supabase can be done as a later backend phase without coupling customer UI code to the staff modules.
