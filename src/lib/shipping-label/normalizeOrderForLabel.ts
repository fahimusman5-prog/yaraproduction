import type { ShippingLabelData, ShippingLabelItem, ShippingLabelPaymentState } from "./types";

type UnknownRecord = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim());
const record = (value: unknown): UnknownRecord => (value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {});

export function getShippingLabelPaymentState(order: UnknownRecord): ShippingLabelPaymentState {
  const paymentStatus = text(order.payment_status).toLowerCase();
  const paymentMethod = text(order.payment_method).toLowerCase();
  const orderStatus = text(order.order_status).toLowerCase();

  if (orderStatus === "cancelled" || paymentStatus === "cancelled") {
    return { type: "cancelled", heading: "CANCELLED ORDER", instruction: "DO NOT DISPATCH" };
  }
  if (orderStatus === "refunded" || paymentStatus === "refunded") {
    return { type: "refunded", heading: "REFUNDED", instruction: "DO NOT COLLECT PAYMENT" };
  }
  if (["paid", "completed", "succeeded"].includes(paymentStatus)) {
    return { type: "prepaid", heading: "PREPAID", instruction: "NO PAYMENT TO COLLECT" };
  }

  const isCod = ["cod", "cash", "cash_on_delivery", "payment_due_on_delivery"].includes(paymentMethod) || paymentStatus === "payment_due_on_delivery";
  const amount = Number(order.total_amount);
  const currency = text(order.currency) || "";
  if (isCod && ["pending", "unpaid", "payment_due_on_delivery", "processing", "not_initiated", ""].includes(paymentStatus)) {
    return { type: "cod", heading: "CASH ON DELIVERY", instruction: `COLLECT ${currency} ${Number.isFinite(amount) ? amount.toFixed(2) : "—"}`, amount, currency };
  }
  if (paymentMethod === "bank_transfer" || paymentStatus === "awaiting_bank_verification") {
    return { type: "pending", heading: "PAYMENT PENDING", instruction: "BANK TRANSFER - VERIFY BEFORE DISPATCH" };
  }
  if (["pending", "processing", "unpaid", "not_initiated", ""].includes(paymentStatus)) {
    return { type: "pending", heading: "PAYMENT PENDING", instruction: "VERIFY PAYMENT BEFORE DISPATCH" };
  }
  return { type: "other", heading: "PAYMENT REVIEW", instruction: `STATUS: ${paymentStatus.replaceAll("_", " ").toUpperCase()}` };
}

function countryName(order: UnknownRecord, snapshot: UnknownRecord) {
  const country = text(snapshot.country) || text(order.country);
  return country.toLowerCase() === "uae" || country.toLowerCase() === "united arab emirates" ? "United Arab Emirates" : country.toLowerCase() === "sri-lanka" || country.toLowerCase() === "sri lanka" ? "Sri Lanka" : country;
}

function uniqueLines(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function normalizeOrderForLabel(order: UnknownRecord, rawItems: UnknownRecord[] = []): ShippingLabelData {
  const snapshot = record(order.shipping_address_snapshot);
  const name = text(snapshot.name) || text(order.customer_name) || "Customer";
  const phone = text(snapshot.phone) || text(order.customer_phone);
  const address = text(snapshot.address) || text(order.shipping_address);
  const address2 = text(snapshot.address2) || text(snapshot.addressLine2) || text(snapshot.address_line_2);
  const city = text(snapshot.city) || text(order.shipping_city);
  const region = text(snapshot.province) || text(snapshot.state) || text(snapshot.emirate) || text(snapshot.district);
  const postal = text(snapshot.postalCode) || text(snapshot.postal_code) || text(order.shipping_postal_code);
  const country = countryName(order, snapshot);
  const addressLines = uniqueLines([address, address2, [city, region, postal].filter(Boolean).join(" "), country]);
  const items: ShippingLabelItem[] = rawItems.map((item) => {
    const product = record(item.products);
    return { name: text(product.name) || "Product", sku: text(product.sku), quantity: Math.max(1, Number(item.quantity) || 1) };
  });
  const estimatedDelivery = text(order.estimated_delivery) || text(order.estimated_delivery_date);
  return {
    orderNumber: text(order.order_number) || text(order.id),
    orderDate: text(order.created_at) || undefined,
    region: country || text(order.region_code),
    currency: text(order.currency),
    customerName: name,
    phone,
    email: text(snapshot.email) || text(order.customer_email) || undefined,
    addressLines,
    country,
    payment: getShippingLabelPaymentState(order),
    items,
    subtotal: Number(order.subtotal_amount) || 0,
    discount: Number(order.discount_amount) || 0,
    delivery: Number(order.shipping_fee) || 0,
    processingFee: Number(order.payment_fee) || 0,
    grandTotal: Number(order.total_amount) || 0,
    courier: text(order.courier_name) || undefined,
    trackingNumber: text(order.tracking_number) || undefined,
    estimatedDelivery: estimatedDelivery || undefined,
    orderStatus: text(order.order_status),
  };
}
