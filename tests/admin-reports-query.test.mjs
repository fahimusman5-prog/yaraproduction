import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("admin reports does not order order_items by the missing created_at column", async () => {
  const source = await readFile(new URL("../src/modules/admin/data.ts", import.meta.url), "utf8");
  const reportsQuery = source.slice(source.indexOf("export async function getReportsData()"));
  const orderItemsQuery = reportsQuery.slice(reportsQuery.indexOf('.from("order_items")'), reportsQuery.indexOf("if (orders.error)"));

  assert.doesNotMatch(orderItemsQuery, /\.order\("created_at"/);
});
