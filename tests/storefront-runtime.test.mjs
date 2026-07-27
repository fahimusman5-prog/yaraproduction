import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("locale routing updates history after render", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const initializer = source.slice(source.indexOf("function getInitialLocale"), source.indexOf("function hasLocalePath"));

  assert.doesNotMatch(initializer, /replaceState/);
  assert.match(source, /useEffect\(\(\) => \{[\s\S]*window\.history\.replaceState/);
});

test("scroll restoration effect never returns the scrollTo result as cleanup", async () => {
  const source = await readFile(new URL("../src/components/Layout.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /useEffect\(\(\) => window\.scrollTo/);
  assert.match(source, /useEffect\(\(\) => \{\s*window\.scrollTo/);
});

test("stored carts wait for the live catalog before reconciliation", async () => {
  const source = await readFile(new URL("../src/context/CartContext.tsx", import.meta.url), "utf8");

  assert.match(source, /const \{ products, loading, error \} = useCatalog\(\)/);
  assert.match(source, /if \(loading \|\| error\) return;\s*setItems/);
});
