import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { SALES_EXPORT_COLUMNS, buildSalesExportRows, filterSalesExportRows, salesRowsToCsv } from "../src/lib/reports/sales-export.ts";

function parseCsv(csv) {
  const source = csv.replace(/^\uFEFF/, "");
  const records = []; let record = []; let field = ""; let quoted = false;
  for (let i = 0; i < source.length; i += 1) { const character = source[i]; const next = source[i + 1]; if (quoted) { if (character === '"' && next === '"') { field += '"'; i += 1; } else if (character === '"') quoted = false; else field += character; } else if (character === '"' && field === "") quoted = true; else if (character === ",") { record.push(field); field = ""; } else if (character === "\n") { record.push(field.replace(/\r$/, "")); records.push(record); record = []; field = ""; } else field += character; }
  return records.filter((row) => row.length > 1 || row[0] !== "");
}

const order = { id: "order-1", order_number: "YARA-20260804162750-15D801", customer_name: "தமிழ் أحمد", customer_email: "customer@example.com", customer_phone: "+94740000000", country: "sri-lanka", currency: "LKR", total_amount: "4489", payment_method: "cash_on_delivery", payment_status: "payment_due_on_delivery", order_status: "processing", created_at: "2026-08-04T16:27:50.062Z", updated_at: "2026-08-04T16:30:00.000Z", shipping_address: "No. 10, Main Road", shipping_city: "Colombo", shipping_postal_code: "01000", shipping_address_snapshot: { address: "No. 10, Main Road", city: "Colombo", postalCode: "01000", phone: "+94740000000", deliveryNotes: "Leave by the gate, call first" }, shipping_method_name: "Fixed countrywide delivery", shipping_fee: "500", subtotal_amount: "3999", discount_amount: "10", coupon_code: "TEST001", payment_fee: "0", provider_payment_id: null, region_code: "LK" };

test("builds one complete, readable order row from actual order snapshots and item joins", () => {
  const [row] = buildSalesExportRows({ orders: [order], orderItems: [{ order_id: "order-1", quantity: 1, unit_price: 2000, subtotal: 2000, products: { name: "VIP Face Cream", sku: "YARA-VIP" } }, { order_id: "order-1", quantity: 2, unit_price: 999.5, subtotal: 1999, products: { name: "Saffron Face Wash", sku: "YARA-SAFFRON" } }], posSales: [], posSaleItems: [], addresses: [] });
  assert.equal(row["Order Date"], "2026-08-04"); assert.equal(row["Order Time"], "16:27:50"); assert.equal(row["Customer Name"], "தமிழ் أحمد"); assert.equal(row["Customer Phone"], "+94740000000"); assert.match(row["Full Delivery Address"], /No\. 10, Main Road/); assert.equal(row["Payment Method"], "Cash on Delivery"); assert.equal(row["Payment Provider"], "COD"); assert.equal(row["Product Summary"], "VIP Face Cream x1 | Saffron Face Wash x2"); assert.equal(row["Currency"], "LKR");
  const records = parseCsv(salesRowsToCsv([row])); assert.equal(records[0].length, SALES_EXPORT_COLUMNS.length); assert.equal(records[1].length, SALES_EXPORT_COLUMNS.length); assert.equal(records[1][SALES_EXPORT_COLUMNS.indexOf("Order Date")], "2026-08-04"); assert.equal(records[1][SALES_EXPORT_COLUMNS.indexOf("Customer Name")], "தமிழ் أحمد"); assert.equal(records[1][SALES_EXPORT_COLUMNS.indexOf("Payment Method")], "Cash on Delivery");
});

test("preserves regional currency and filter semantics for POS and UAE rows", () => {
  const rows = buildSalesExportRows({ orders: [{ ...order, id: "ae", order_number: "AE-1", country: "uae", currency: "AED", region_code: "AE", payment_method: "bank_transfer", payment_status: "awaiting_bank_verification" }], orderItems: [], posSales: [{ id: "pos-1", sale_number: "POS-1", payment_method: "card", subtotal: 10, discount: 0, total_amount: 10, currency: "AED", created_at: "2026-08-04T18:00:00Z" }], posSaleItems: [], addresses: [] });
  const ae = rows.find((row) => row.Region === "UAE" && row.Source === "Online"); const pos = rows.find((row) => row.Source === "POS"); assert.equal(ae.Currency, "AED"); assert.equal(ae["Payment Method"], "Bank Transfer"); assert.equal(pos.Source, "POS"); assert.equal(filterSalesExportRows(rows, { source: "pos", region: "AE" }).length, 1); assert.equal(filterSalesExportRows(rows, { paymentMethod: "bank_transfer" }).length, 1);
});

test("does not emit Excel serial dates or misaligned fields", () => {
  const row = buildSalesExportRows({ orders: [order], orderItems: [], posSales: [], posSaleItems: [], addresses: [] })[0]; const records = parseCsv(salesRowsToCsv([row]));
  for (const record of records.slice(1)) { assert.equal(record.length, SALES_EXPORT_COLUMNS.length); assert.doesNotMatch(record[2], /^\d+\.\d+$/); }
});

test("the only export endpoint is server-admin protected and the Reports button calls it", async () => {
  const route = await readFile(new URL("../src/app/api/admin/reports/export/route.ts", import.meta.url), "utf8");
  const view = await readFile(new URL("../src/modules/admin/components/ReportsView.tsx", import.meta.url), "utf8");
  assert.match(route, /await requireAdmin\("\/admin\/reports"\)/); assert.match(route, /loadSalesExport/); assert.match(route, /salesRowsToCsv/); assert.match(view, /fetch\("\/api\/admin\/reports\/export"/); assert.match(view, /format: "csv"/);
});
