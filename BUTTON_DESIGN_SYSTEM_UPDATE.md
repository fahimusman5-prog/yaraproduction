# Premium pink liquid-glass button system

## Original visual problems

- Storefront actions mixed pale glass controls, one-off utility classes, and stronger primary buttons without a complete shared state system.
- The product-card Add to Cart control was only 40×40px and depended on a local colour override, making it easy to miss on white, blush, or image-heavy cards.
- Hover, focus, loading, success, disabled, and destructive treatments were not equally complete across every semantic variant.
- Several compact controls fell below the desired 44px touch target, and the shop filter/sort toolbar could create horizontal overflow at 320px.

## Design decisions

`src/index.css` remains the single source of truth. The existing YARA rose palette was extended into semantic liquid-glass tokens rather than replacing the storefront design or adding file-level visual recipes.

The primary treatment uses a deep rose-to-burgundy translucent gradient, a fine pearl edge, a static reflective layer, restrained blur/saturation, a soft lower shadow, and an internal top highlight. Secondary controls retain a visibly pink glass surface with dark ink text. WhatsApp actions remain green-accented where brand recognition is more useful than forcing a pink primary style.

Transitions are 200ms, hover lifts by 1px, active compresses to `0.985`, and decorative movement is disabled under `prefers-reduced-motion`. No animation library or continuous glow animation was added.

## Shared variants

- `btn-primary`: Add to Cart, Buy Now, checkout, submit, and prominent calls to action.
- `btn-secondary`: lower-emphasis actions such as Continue Shopping, account actions, and country changes.
- `glass-control`: filters, sorting, language/country controls, and branded secondary utility actions.
- `glass-icon`: secondary icon-only controls.
- `glass-icon-primary`: deep rose 44px icon CTA used by product-card Add to Cart, newsletter submit, and review-gallery controls.
- `btn-destructive` and `glass-icon-destructive`: accessible red-toned destructive treatments; cart removal uses the icon variant.

All semantic variants directly share the glass surface, reflective overlays, hover, active, focus, disabled, reduced-motion, and fallback rules. There is no competing second button system.

## Tokens

- `--yara-rose-700`, `--yara-rose-600`, `--yara-rose-500`, `--yara-rose-400`
- `--yara-button-border`, `--yara-button-highlight`
- `--yara-button-shadow`, `--yara-button-shadow-hover`
- `--yara-control-border`, `--yara-control-surface`, `--yara-control-surface-hover`
- `--yara-disabled-surface`
- `--yara-focus-ring`

## Components and files changed

- `src/index.css`: centralized tokens, all variants, interaction states, Safari-prefixed blur, opaque no-blur fallback, and reduced-motion behavior.
- `src/components/ProductCard.tsx`: 44×44px primary Add to Cart control with spinner, repeat-click protection, checkmark confirmation, cleanup-safe timers, and out-of-stock state.
- `src/components/Layout.tsx`: navigation, cart, mobile menu, footer social controls, country actions, and newsletter anchor consistency.
- `src/components/CountryContactSelector.tsx`: 44px selector and dialog controls.
- `src/components/NewsletterForm.tsx`: primary submit icon with loading and success feedback.
- `src/components/ProductReviews.tsx`: shared primary gallery close and carousel controls.
- `src/customer-pages/ProductPage.tsx`: primary Add to Cart and Buy Now actions, 44px quantity controls, stock state, and confirmation feedback.
- `src/customer-pages/CartPage.tsx`: secondary Continue Shopping, 44px quantity controls, and destructive Remove.
- `src/customer-pages/CheckoutPage.tsx`: readable disabled state, loading spinner, and `aria-busy`.
- `src/customer-pages/ShopPage.tsx`: filters, sorting, search clear, working newsletter link, responsive toolbar, and narrow-layout overflow repair.
- `src/customer-pages/LoginPage.tsx`: 44px password visibility control and secondary account action.

Home, About, Contact, skin-concern, empty-state, promotional, and form CTAs inherit the upgraded shared variants without unrelated layout or content redesign.

## Accessibility

- White against the primary gradient stops measures from 6.04:1 to 10.92:1; dark ink against the secondary surface measures from 11.42:1 to 15.08:1.
- The shared focus state combines a 3px non-colour-only outline with an offset ring.
- Every visible button on the audited routes is at least 44px high; icon buttons are 44×44px or larger.
- Icon-only controls have accessible names. The product-card state exposes `aria-busy`, disables repeat activation while loading, and announces loading/success/out-of-stock labels.
- Native button, link, select, and form semantics were retained.
- Disabled controls remain readable, remove hover movement, and use `not-allowed` feedback without fading into the background.

## Responsive and interaction checks

Chromium browser QA covered 320×700, 375×812, 390×844, 768×900, 1024×900, 1280×900, and 1440×1000.

- No horizontal overflow remained at any audited width.
- No visible customer-facing button was below 44px.
- Sort labels remained contained, circular controls stayed circular, and product cards did not shift.
- Home, Shop, Product Detail, Cart, Checkout, Login, and Contact had no unnamed visible buttons or horizontal overflow at mobile and desktop widths.
- Product-card Add to Cart was confirmed at 44×44px with white icon, deep-rose gradient, loading spinner, disabled repeat-click state, and checkmark success feedback.
- Keyboard focus on Add to Cart showed the shared 3px outline and offset focus ring.
- Client console review found no errors. The local fallback catalog continues to emit its pre-existing missing-priority-product warning.
- The local browser run used the built-in fallback catalog because Supabase public configuration is absent in this checkout. Cart state and checkout layout were exercised, but provider-backed catalog, reviews, and payment submission were not live-verifiable locally.

## Browser fallback

The standard `backdrop-filter` and Safari `-webkit-backdrop-filter` declarations are both present. An `@supports` fallback replaces translucent surfaces with opaque deep rose, pink, or red gradients, so controls remain readable when blur is unsupported. Runtime visual QA was performed in the available Chromium browser; Safari and Firefox compatibility was verified at the CSS/fallback level, not in separate browser engines.

## Test and build results

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 35/35.
- `npm run build` — passed with Next.js 16.2.9.
- `git diff --check` — passed.

## Before-and-after screenshot locations

| Surface | Before | After |
| --- | --- | --- |
| Desktop shop | `docs/button-design-system/before/desktop-shop.png` | `docs/button-design-system/after/desktop-shop.png` |
| Mobile shop | `docs/button-design-system/before/mobile-shop.png` | `docs/button-design-system/after/mobile-shop.png` |
| Mobile product card | — | `docs/button-design-system/after/mobile-product-card.png` |
| Product details | `docs/button-design-system/before/product-details.png` | `docs/button-design-system/after/product-details.png` |
| Cart | `docs/button-design-system/before/cart.png` | `docs/button-design-system/after/cart.png` |
| Checkout | `docs/button-design-system/before/checkout.png` | `docs/button-design-system/after/checkout.png` |
| Footer newsletter | `docs/button-design-system/before/footer-newsletter.png` | `docs/button-design-system/after/footer-newsletter.png` |
| Desktop navigation | `docs/button-design-system/before/navigation-controls.png` | `docs/button-design-system/after/navigation-controls.png` |
| Mobile navigation | `docs/button-design-system/before/mobile-navigation-controls.png` | `docs/button-design-system/after/mobile-navigation-controls.png` |
