import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin product image contract fits within the Server Action request limit", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  const action = await readFile(new URL("../src/modules/admin/actions.ts", import.meta.url), "utf8");

  assert.match(action, /file\.size > 5 \* 1024 \* 1024/);
  assert.match(config, /serverActions:\s*\{\s*bodySizeLimit:\s*"6mb"/s);
});
