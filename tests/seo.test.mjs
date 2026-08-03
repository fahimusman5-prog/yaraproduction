import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("SEO metadata uses the production canonical origin and branded homepage copy", async () => {
  const [layout, seo] = await Promise.all([read("../src/app/layout.tsx"), read("../src/lib/seo.ts")]);
  assert.match(layout, /YARA Productions \| Premium Skincare in Sri Lanka & UAE/);
  assert.match(seo, /SITE_ORIGIN = "https:\/\/www\.yaraproduct\.com"/);
  assert.match(seo, /YARA Productions/);
});

test("robots blocks utility routes and references the production sitemap", async () => {
  const robots = await read("../src/app/robots.ts");
  for (const route of ["/admin", "/pos", "/api", "/cart", "/checkout", "/account", "/login", "/reset-password"]) assert.match(robots, new RegExp(route.replace("/", "\\/")));
  assert.match(robots, /sitemap:/);
  assert.doesNotMatch(robots, /Disallow: \/"/);
});

test("sitemap contains active database URLs only and never utility routes", async () => {
  const sitemap = await read("../src/app/sitemap.ts");
  assert.match(sitemap, /status", "active"/);
  assert.match(sitemap, /is_active", true/);
  for (const route of ["admin", "checkout", "account", "cart", "api"]) assert.doesNotMatch(sitemap, new RegExp(`\\/${route}`));
  assert.doesNotMatch(sitemap, /localhost/);
});

test("product route emits product metadata, regional offers and breadcrumbs without ratings", async () => {
  const route = await read("../src/app/[locale]/product/[slug]/page.tsx");
  assert.match(route, /Product/);
  assert.match(route, /priceCurrency: "LKR"/);
  assert.match(route, /priceCurrency: "AED"/);
  assert.match(route, /breadcrumbSchema/);
  assert.doesNotMatch(route, /aggregateRating|review:/);
});

test("private and missing storefront paths are protected from indexing", async () => {
  const [page, proxy, seo] = await Promise.all([read("../src/app/[[...storefront]]/page.tsx"), read("../src/proxy.ts"), read("../src/lib/seo.ts")]);
  assert.match(page, /notFound\(\)/);
  assert.match(proxy, /status: 404/);
  assert.match(page, /privatePages/);
  assert.match(seo, /index: false/);
});

test("localized alternates include all real locales and x-default", async () => {
  const seo = await read("../src/lib/seo.ts");
  for (const locale of ["en", "si", "ta", "ar"]) assert.match(seo, new RegExp(`"${locale}"`));
  assert.match(seo, /x-default/);
});
