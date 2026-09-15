import test from "node:test";
import assert from "node:assert/strict";
import { createOrderPdfToken, verifyOrderPdfToken } from "../src/lib/order-pdf-token.ts";
import { generateOrderPdf } from "../src/lib/order-pdf.ts";

test("order PDF tokens are order-scoped, tamper resistant, and expiring", () => {
  process.env.ORDER_PDF_SECRET = "test-order-pdf-secret";
  const token = createOrderPdfToken("YARA-202609151020-ABC123");
  assert.equal(verifyOrderPdfToken(token)?.orderNumber, "YARA-202609151020-ABC123");
  const [payload, signature] = token.split(".");
  assert.equal(verifyOrderPdfToken(`${payload[0] === "A" ? "B" : "A"}${payload.slice(1)}.${signature}`), null);
  assert.equal(verifyOrderPdfToken(`${payload}.a${signature.slice(1)}`), null);
  assert.equal(verifyOrderPdfToken(createOrderPdfToken("YARA-OLD", -1)), null);
});

test("A4 order PDF contains historical customer, items, totals, and payment state", () => {
  const pdf = new TextDecoder().decode(generateOrderPdf({
    id: "order-id", orderNumber: "YARA-100", createdAt: "2026-09-15T04:50:00.000Z",
    customerName: "Fathima Ulfa", phone: "+94 77 000 0000", email: "customer@example.com", country: "Sri Lanka", currency: "LKR",
    addressLines: ["22 Rose Road", "Colombo 05", "Sri Lanka"], items: [{ name: "YARA Treatment Soap", sku: "YARA-SOAP", quantity: 2, unitPrice: 100, subtotal: 200 }],
    subtotal: 200, discount: 20, shipping: 500, paymentFee: 0, total: 680, paymentMethod: "cash_on_delivery", paymentStatus: "pending", orderStatus: "pending",
    payment: { type: "cod", heading: "CASH ON DELIVERY", instruction: "COLLECT LKR 680.00", amount: 680, currency: "LKR" },
  }));
  assert.match(pdf, /%PDF-1\.4/);
  assert.match(pdf, /Fathima Ulfa/);
  assert.match(pdf, /YARA Treatment Soap/);
  assert.match(pdf, /CASH ON DELIVERY/);
});
