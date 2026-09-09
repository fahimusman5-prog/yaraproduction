import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("footer credits Zentrox.lk with the supplied WhatsApp contact", async () => {
  const source = await readFile(new URL("../src/components/Layout.tsx", import.meta.url), "utf8");

  assert.match(source, /Powered by/);
  assert.match(source, /Zentrox\.lk/);
  assert.match(source, /https:\/\/wa\.me\/94720626224/);
  assert.match(source, /Contact Zentrox\.lk on WhatsApp/);
});
