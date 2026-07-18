# Production release checklist

## Verification results

| Gate | Result | Evidence/blocker |
|---|---|---|
| Correct source checkout | PASS | `/Users/usmanfahim08/Documents/GitHub/yaraproduction`, branch `fix/production-launch` |
| Dependency install | PASS with warning | `npm ci`; Node 26.4.0 was used while `package.json` requests Node 24.x |
| Type check | PASS | `npm run typecheck` |
| Lint script | PASS by project definition | `npm run lint` is the same `tsc --noEmit` command; run after final review |
| Automated tests | PASS | `npm test`: 29 passed, 0 failed |
| Production build | PASS | `npm run build`; Next 16.2.9 produced all listed routes including `robots.txt` and `sitemap.xml` |
| Supabase connectivity | PASS | Project healthy; tables, migrations, function definitions and RLS inspected |
| Launch migration | PASS | Applied and verified in project `yhywklzutqzwafulnpcu` |
| Admin login and role checks | PARTIAL | Code path is protected; authenticated browser test was not available |
| Product CRUD/catalog | PARTIAL | Code and live schema align; no safe production write was performed |
| Stock purchase/cancellation | PARTIAL | SQL paths verified; no destructive order was created for testing |
| LK/UAE checkout | BLOCKED | Requires configured deployment environment and safe payment/COD test records |
| PayHere init/callback/idempotency | BLOCKED | Provider credentials and callback test are unavailable |
| Shipping calculation | FAIL | No shipping rules or admin-managed shipping implementation exists |
| Refunds/returns | FAIL | No complete refund/return workflow exists |
| Guest order endpoint | PASS in code | HMAC token required; endpoint runtime test still needs a configured app environment |
| SEO metadata/robots/sitemap | PARTIAL | Code exists; live HTTP/browser verification remains |
| Mobile checkout/admin | BLOCKED | No authenticated device/browser session was available |
| Deployment target | BLOCKED | Vercel project discovery was unavailable and no deployment was initiated |

## Commands

```text
npm ci
npm run typecheck
npm test
npm run build
```

## Release decision

Do not deploy. Critical gates for shipping calculation, PayHere callback verification, refunds/returns, authenticated mobile QA, and deployment environment verification remain incomplete.
