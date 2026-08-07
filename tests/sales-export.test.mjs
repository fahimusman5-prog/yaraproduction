import test from "node:test";
import assert from "node:assert/strict";
import { buildSalesExportRows, filterSalesExportRows, SALES_EXPORT_COLUMNS, salesRowsToCsv } from "../src/lib/reports/sales-export.ts";
import { readFile } from "node:fs/promises";

const order = (overrides = {}) => ({ id: "order-1", order_number: "YARA-1", created_at: "2026-08-04T04:00:00.000Z", updated_at: "2026-08-04T04:00:00.000Z", customer_name: "ஃபாத்திமா, أمينة", customer_email: "f@example.com", customer_phone: "0712345678", country: "sri-lanka", region_code: "LK", currency: "LKR", order_status: "processing", payment_status: "pending", payment_method: "cash_on_delivery", total_amount: 4489, subtotal_amount: 3989, discount_amount: 0, shipping_fee: 500, payment_fee: 0, shipping_address: "No. 25, Example Road", shipping_city: "Colombo", shipping_postal_code: "00100", shipping_method_name: "Standard delivery", customer_note: "Leave at gate", ...overrides });

test("builds one complete row per online order and combines products", () => {
  const rows = buildSalesExportRows({ orders: [order()], orderItems: [{ order_id: "order-1", quantity: 2, unit_price: 1999.5, subtotal: 3999, products: { name: "VIP Face Cream", sku: "YARA-VIP-FACE", description: "Face care" } }, { order_id: "order-1", quantity: 1, unit_price: 490, subtotal: 490, products: { name: "Saffron Face Wash", sku: "YARA-SAF-WASH" } }], posSales: [], posSaleItems: [] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]["Product Names"], "VIP Face Cream x2 | Saffron Face Wash x1");
  assert.equal(rows[0]["Product SKUs"], "YARA-VIP-FACE x2 | YARA-SAF-WASH x1");
  assert.equal(rows[0]["Payment Method"], "Cash on Delivery");
  assert.equal(rows[0].Currency, "LKR");
  assert.match(String(rows[0]["Full Delivery Address"]), /Example Road, Colombo/);
});

test("preserves UAE currency, exports POS, and applies source/region filters", () => {
  const rows = buildSalesExportRows({ orders: [order({ id: "order-2", order_number: "YARA-AE-1", country: "uae", region_code: "AE", currency: "AED", total_amount: 125 })], orderItems: [], posSales: [{ id: "sale-1", sale_number: "POS-1", currency: "LKR", payment_method: "cash", subtotal: 100, discount: 0, total_amount: 100, created_at: "2026-08-04T05:00:00.000Z" }], posSaleItems: [] });
  assert.deepEqual([...new Set(rows.map((row) => row.Source))], ["POS", "Online"]);
  assert.equal(filterSalesExportRows(rows, { source: "pos" }).length, 1);
  assert.equal(filterSalesExportRows(rows, { region: "AE" })[0].Currency, "AED");
});

test("uses RFC escaping and UTF-8 BOM for spreadsheet compatibility", () => {
  const rows = buildSalesExportRows({ orders: [order()], orderItems: [], posSales: [], posSaleItems: [] });
  const csv = salesRowsToCsv(rows);
  assert.equal(csv.codePointAt(0), 0xfeff);
  assert.match(csv, /"ஃபாத்திமா, أمينة"/);
  assert.match(csv, /"No\. 25, Example Road/);
  assert.match(csv, /\r\n/);
  assert.equal(SALES_EXPORT_COLUMNS.length, 59);
});

test("export route is server-authorized and returns a server-generated attachment", async () => {
  const route = await readFile(new URL("../src/app/api/admin/reports/export/route.ts", import.meta.url), "utf8");
  assert.match(route, /requireAdmin\("\/admin\/reports"\)/);
  assert.match(route, /loadSalesExport/);
  assert.match(route, /salesRowsToCsv/);
  assert.doesNotMatch(route, /Blob|document\.createElement/);
});
