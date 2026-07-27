import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rpcFiles = [
  "src/app/api/checkout/route.ts",
  "src/app/api/payhere/notify/route.ts",
  "src/modules/admin/actions.ts",
  "src/modules/pos/actions.ts",
];

test("Supabase RPC wrappers preserve the client binding", async () => {
  for (const path of rpcFiles) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\.rpc\s+as unknown/, `${path} detaches Supabase RPC from its client`);
    assert.match(source, /\.rpc\.bind\(/, `${path} must bind Supabase RPC to its client`);
  }
});

test("secret-backed admin reads enforce staff authorization", async () => {
  const source = await readFile(new URL("../src/modules/admin/data.ts", import.meta.url), "utf8");
  assert.match(source, /await requireStaff\(nextPath\)/);
});
