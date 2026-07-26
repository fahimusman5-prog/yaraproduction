# Premium pink liquid-glass button system

## Original visual problem

The storefront had a shared glass button base, but primary actions were not consistently strong enough against pale product, ivory, and pink surfaces. The product-card Add to Cart control was particularly easy to miss: it was a 40px control with a local dark-background override rather than a dedicated primary icon variant.

## Design decisions

The existing shared CSS system in `src/index.css` remains the single source of truth. It now uses a deep rose-to-burgundy translucent gradient, fine light edge, internal highlight, controlled rose shadow, and backdrop blur/saturation. The treatment favours depth and legibility over bright or neon colour.

## Variants

- `btn-primary`: purchasing, submit, checkout, and prominent calls to action.
- `btn-secondary`: lower-emphasis, pale-pink glass actions with strong dark text.
- `glass-control`: compact secondary controls for filters, selectors, and utility actions.
- `glass-icon`: secondary icon-only controls.
- `glass-icon-primary`: dark rose 44px minimum icon CTA, used by product-card Add to Cart and newsletter submit.
- `btn-destructive` and `glass-icon-destructive`: reserved red-toned destructive action treatments; cart removal uses the 44px icon variant.

## Tokens and interaction states

The system adds `--yara-rose-700`, `--yara-rose-600`, `--yara-rose-500`, `--yara-focus-ring`, `--yara-button-border`, `--yara-button-highlight`, and layered button-shadow tokens. Hover lifts by 1px, active compresses to `0.985`, and disabled states remove elevation and reduce saturation. All motion uses CSS transforms and opacity with a 200ms transition; the existing reduced-motion rules disable the decorative movement.

## Accessibility and responsive behaviour

- Primary labels and icons are white against a dark rose base; secondary text uses the existing dark ink colour.
- The shared visible focus outline is now a 3px rose focus ring with offset.
- Primary icon actions have a 44×44px minimum target. The product-card control was increased from 40px to 44px.
- Product-card Add to Cart prevents repeat activation while the short confirmation state is shown, displays a spinner, then a checkmark, and preserves its dimensions.
- Existing semantic buttons/links and icon `aria-label`s are retained. No navigation links were converted into oversized controls.

## Components and files changed

- `src/index.css`: centralized tokens, variants, Safari-prefixed glass treatment, non-blur fallback, focus, disabled, and state styling.
- `src/components/ProductCard.tsx`: primary 44px Add to Cart control plus loading and success feedback.
- `src/components/NewsletterForm.tsx`: primary icon submit control retains its spinner behaviour.
- `src/customer-pages/ProductPage.tsx`, `CartPage.tsx`, and `CheckoutPage.tsx`: checkout and WhatsApp action consistency; checkout now has an in-button loading spinner.
- `src/components/ProductReviews.tsx`: modal close and carousel controls use the shared primary icon treatment.

## Browser fallback

Where `backdrop-filter` is unavailable, the system removes the translucent image layer and provides opaque deep rose primary surfaces and pale rose secondary surfaces. Buttons remain polished, readable, and visibly actionable without blur.

## Verification

Completed after implementation:

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed (35 tests).
- `npm run build` — passed (Next.js 16.2.9 production build).

## Visual review evidence

The planned after screenshots are:

- `/tmp/yara-button-system-2026-07-26/shop-desktop-after.png`
- `/tmp/yara-button-system-2026-07-26/shop-mobile-after.png`
- `/tmp/yara-button-system-2026-07-26/product-detail-after.png`
- `/tmp/yara-button-system-2026-07-26/cart-after.png`
- `/tmp/yara-button-system-2026-07-26/checkout-after.png`
- `/tmp/yara-button-system-2026-07-26/footer-newsletter-after.png`
- `/tmp/yara-button-system-2026-07-26/navigation-controls-after.png`

The local in-app browser could not connect to the development server in this run (`ERR_CONNECTION_REFUSED`), including after a direct server launch attempt. As a result, the screenshot files were not generated and desktop/mobile interaction visual QA remains blocked by this execution environment. The implementation has build and type-level verification, but the above browser checks should be run in an environment where the browser can access the local dev server before calling visual QA complete.
