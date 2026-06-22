# YARA Luxury Skincare

A responsive React storefront rebuilt from the supplied Google Stitch references. It includes product discovery, filtering, persistent cart state, checkout UI, and WhatsApp ordering.

## Run locally

```bash
npm install
npm run dev
```

Create a `.env.local` file from `.env.example` and set `VITE_WHATSAPP_NUMBER` to the business WhatsApp number in international format without `+` or spaces. If it is omitted, WhatsApp opens the share flow with the order message pre-filled.

## Production build

```bash
npm run build
npm run preview
```

## Open directly as HTML

Double-click `YARA.html` to open the complete storefront without running a server. Regenerate it after code changes with:

```bash
npm run build:html
```

The project is front-end ready. Connect the checkout and login forms to the preferred commerce, payment, and authentication services before accepting live orders.
