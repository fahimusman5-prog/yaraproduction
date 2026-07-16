import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/customer-pages/IngredientsPage.tsx", import.meta.url), "utf8");
const translationsSource = readFileSync(new URL("../src/i18n.tsx", import.meta.url), "utf8");
const metadataSource = readFileSync(new URL("../src/app/[[...storefront]]/page.tsx", import.meta.url), "utf8");
const metadataContent = readFileSync(new URL("../src/data/ingredients-seo.ts", import.meta.url), "utf8");

test("ingredients page keeps saffron as the signature ingredient and pairs niacinamide with Vitamin B3", () => {
  assert.match(pageSource, /featured: true/);
  assert.match(pageSource, /ingredients\.niacinamide\.alternateName/);
  assert.match(translationsSource, /heroBadgeTitle: "Saffron"/);
  assert.match(translationsSource, /alternateName: "Vitamin B3"/);
});

test("ingredients page uses optimized local imagery and semantic benefit lists", () => {
  assert.match(pageSource, /import Image from "next\/image"/);
  assert.match(pageSource, /width=\{1254\}/);
  assert.match(pageSource, /<ul className=/);
  assert.doesNotMatch(pageSource, /https?:\/\//);
});

test("ingredients route has route-specific metadata", () => {
  assert.match(metadataSource, /isIngredientsPage/);
  assert.match(metadataSource, /ingredientsSeo\.title/);
  assert.match(metadataSource, /ingredientsSeo\.description/);
  assert.match(metadataContent, /YARA Skincare Ingredients/);
});
