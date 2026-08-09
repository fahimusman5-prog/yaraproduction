import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the canonical catalogue route is locale-prefixed", async () => {
  const routes = await read("../src/lib/storefront-routes.ts");
  assert.match(routes, /return `\/\$\{locale\}\/shop\$\{search\}`/);
});

test("legacy /shop redirects permanently to the English catalogue and preserves filters", async () => {
  const config = await read("../next.config.ts");
  assert.match(config, /source: "\/shop"/);
  assert.match(config, /destination: "\/en\/shop"/);
  assert.match(config, /permanent: true/);
});

test("payment success preserves the checkout locale for Continue Shopping", async () => {
  const [success, checkout] = await Promise.all([
    read("../src/app/payment/success/page.tsx"),
    read("../src/customer-pages/CheckoutPage.tsx"),
  ]);
  assert.match(success, /locale\?: string/);
  assert.match(success, /getCataloguePath\(resolveStorefrontLocale\(locale\)\)/);
  assert.match(checkout, /country, locale, paymentMethod/);
});

test("server-side Explore YARA uses the canonical catalogue route", async () => {
  const notFound = await read("../src/app/not-found.tsx");
  assert.match(notFound, /getCataloguePath\(\)/);
  assert.doesNotMatch(notFound, /href=["']\/shop["']/);
});

test("the Next catch-all still exposes every locale shop page", async () => {
  const page = await read("../src/app/[[...storefront]]/page.tsx");
  assert.match(page, /publicPages = new Set\(\["", "shop"/);
  for (const locale of ["en", "si", "ta", "ar"]) assert.match(page, /isLocale\(locale\)/);
});

test("localized private checkout paths remain inside the storefront shell", async () => {
  const page = await read("../src/app/[[...storefront]]/page.tsx");
  assert.match(page, /if \(privatePages\.has\(path\)\) return <CustomerStorefront \/>/);
});
