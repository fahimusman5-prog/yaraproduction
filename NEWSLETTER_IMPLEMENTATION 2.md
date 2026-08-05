# Newsletter implementation

## Root cause

The footer displayed an email input and arrow button, but its form handler only called `preventDefault()`. It made no request, performed no validation feedback, and had no database or admin implementation.

## What changed

- `src/components/NewsletterForm.tsx` adds the accessible, responsive client form with validation, loading feedback, honeypot input, controlled messages, and successful-input reset.
- `src/app/api/newsletter/route.ts` adds the JSON-only, size-limited, rate-limited server endpoint. It validates and normalizes emails, uses the existing server-only Supabase secret client, handles unique-index races, and never returns database details.
- `supabase/migrations/20260726160251_add_newsletter_subscribers.sql` creates `newsletter_subscribers`, its indexes, `updated_at` trigger, status constraint, and RLS policies.
- `/admin/newsletter` provides admin-only counts, search, subscriber status management, and CSV export at `/api/admin/newsletter/export`.

## Security and RLS

RLS is enabled. There is no anonymous or authenticated insert policy, so visitors cannot insert directly through Supabase. Read and update policies require `private.is_admin()` for authenticated administrators. The public route and admin server code use the existing server-only `SUPABASE_SECRET_KEY`; it is never bundled into the browser. The route applies a 2 KB JSON limit, IP-window rate limiting (six attempts per ten minutes per runtime), and a hidden honeypot field.

## Environment

The feature uses existing variables only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server only)

No welcome-email provider was configured, so no email service was added. No local secret values were changed.

## Apply and verify the database

This checkout has no local Supabase credentials or linked project, so the migration was not applied from this machine and no real subscriber record was created here.

From a trusted machine with the Supabase CLI authenticated and linked to the intended project:

```bash
cd /Users/usmanfahim08/Documents/GitHub/yaraproduction
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
npx supabase@latest migration list
```

Then deploy the application with the three existing Supabase variables configured, submit a real test address through the footer, confirm the row in `public.newsletter_subscribers`, verify duplicate and reactivation responses, and sign in as an admin to check `/admin/newsletter` and its CSV export.

## Testing completed

- `npm ci --include=dev --ignore-scripts`
- `npm run lint`
- `npm run typecheck`
- `npm test` — 35 passing tests, including newsletter validation, normalization, race/error/RLS source guards, admin authorization/export, loading/reset, and semantic form submission coverage.
- `npm run build`
- Local browser QA at desktop and 375px: footer newsletter controls rendered, invalid-email feedback retained the typed value, no horizontal overflow at 375px, and no browser console errors.

The actual Supabase insert, admin listing/export against live records, and production migration verification remain pending the manual database steps above.
