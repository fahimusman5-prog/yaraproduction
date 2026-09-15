import test from "node:test";
import assert from "node:assert/strict";
import { getShippingLabelPaymentState, normalizeOrderForLabel } from "../src/lib/shipping-label/normalizeOrderForLabel.ts";
import { generateShippingLabel } from "../src/lib/shipping-label/generateShippingLabel.ts";

const base = { id: "uuid", order_number: "YARA-20260914223117-D5OFD7", customer_name: "Fathima Ulfa", customer_email: "f@example.com", customer_phone: "0714339980", shipping_address: "Initium Road", shipping_city: "Dehiwala", shipping_postal_code: "10350", country: "sri-lanka", currency: "LKR", total_amount: 4449, payment_method: "cash_on_delivery", payment_status: "payment_due_on_delivery", order_status: "processing", shipping_address_snapshot: { name: "Fathima Ulfa", phone: "0714339980", address: "Initium Road", city: "Dehiwala", postalCode: "10350", country: "sri-lanka" } };

test("normalizes historical address snapshot and COD final total", () => {
  const data = normalizeOrderForLabel(base, [{ quantity: 1, products: { name: "Night Cream", sku: "YARA-NC" } }]);
  assert.deepEqual(data.addressLines, ["Initium Road", "Dehiwala 10350", "Sri Lanka"]);
  assert.equal(data.payment.type, "cod");
  assert.equal(data.payment.instruction, "COLLECT LKR 4449.00");
  assert.equal(data.items[0].quantity, 1);
});

test("paid takes precedence over COD method; bank transfer pending is not COD", () => {
  assert.equal(getShippingLabelPaymentState({ ...base, payment_status: "paid" }).type, "prepaid");
  assert.equal(getShippingLabelPaymentState({ ...base, payment_method: "bank_transfer", payment_status: "awaiting_bank_verification" }).type, "pending");
  assert.equal(getShippingLabelPaymentState({ ...base, currency: "AED", total_amount: 125, country: "uae" }).instruction, "COLLECT AED 125.00");
});

test("cancelled and refunded orders cannot be dispatched normally", () => {
  assert.equal(getShippingLabelPaymentState({ ...base, order_status: "cancelled" }).instruction, "DO NOT DISPATCH");
  assert.equal(getShippingLabelPaymentState({ ...base, payment_status: "refunded" }).instruction, "DO NOT COLLECT PAYMENT");
});

test("PDF is vector-based and exactly 4 by 6 inches", () => {
  const data = normalizeOrderForLabel(base, Array.from({ length: 7 }, (_, index) => ({ quantity: index + 1, products: { name: `Product ${index}`, sku: `SKU-${index}` } })));
  const pdf = new TextDecoder().decode(generateShippingLabel(data));
  assert.match(pdf, /\/MediaBox \[0 0 288 432\]/);
  assert.match(pdf, /CASH ON DELIVERY/);
  assert.match(pdf, /\/Type \/Font/);
  assert.match(pdf, /\/Count 2/);
});

test("long orders get a readable contents continuation page", () => {
  const data = normalizeOrderForLabel({ ...base, shipping_address_snapshot: { ...base.shipping_address_snapshot, address: "Building 12, Apartment 4, Very Long Street Name, Al Barsha South, Dubai, United Arab Emirates" } }, Array.from({ length: 6 }, (_, index) => ({ quantity: 1, products: { name: `Long Product Name ${index}`, sku: `SKU-${index}` } })));
  const pdf = new TextDecoder().decode(generateShippingLabel(data));
  assert.match(pdf, /\/Count 2/);
  assert.match(pdf, /ORDER CONTENTS \/ CONTINUED/);
});
