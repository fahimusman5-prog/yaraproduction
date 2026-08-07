export const SALES_EXPORT_COLUMNS = [
  "Order ID", "Order Number / Reference", "Order Date", "Order Time", "Order Status", "Fulfilment Status", "Payment Status", "Source", "Region", "Currency",
  "Customer Name", "Customer Email", "Customer Phone Number", "Customer WhatsApp Number", "Customer/User ID",
  "Delivery Address Line 1", "Delivery Address Line 2", "City", "District / State / Emirate", "Postal Code", "Country", "Full Delivery Address", "Billing Address", "Delivery Notes / Customer Notes",
  "Payment Method", "Payment Provider", "Payment Option", "Payment Reference / Transaction ID", "PayHere Payment ID", "Bank Transfer Reference", "Payment Date",
  "Subtotal", "Discount Amount", "Coupon Code", "Shipping Fee", "Payment / Processing Fee", "Tax", "Order Total", "Amount Paid", "Amount Due", "Refund Amount",
  "Total Number of Items", "Product Names", "Product SKUs", "Quantities", "Unit Prices", "Product Line Totals", "Product Details",
  "Delivery Method", "Delivery Fee", "Courier / Shipping Provider", "Tracking Number", "Dispatch Status", "Dispatch Date", "Delivered Date",
  "Created At", "Updated At", "Created By / Admin", "Internal Notes",
] as const;

type AnyRecord = Record<string, any>;
export type ReportFilters = {
  query?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
  region?: string;
  source?: string;
  paymentMethod?: string;
  method?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

export type SalesExportRow = Record<(typeof SALES_EXPORT_COLUMNS)[number], string | number>;

const methodLabels: Record<string, string> = {
  cod: "Cash on Delivery", cash_on_delivery: "Cash on Delivery", bank_transfer: "Bank Transfer",
  payhere: "PayHere Card", card: "Card Payment", cash: "POS Cash", pos_cash: "POS Cash", pos_card: "POS Card",
  stripe: "Card Payment", koko: "Koko", mintpay: "Mintpay",
};
const statusLabels: Record<string, string> = {
  pending: "Pending", pending_payment: "Pending payment", awaiting_bank_transfer: "Awaiting bank transfer",
  awaiting_bank_verification: "Awaiting bank verification", unpaid: "Unpaid", paid: "Paid", confirmed: "Confirmed",
  processing: "Processing", packed: "Packed", shipped: "Shipped / Dispatched", delivered: "Delivered",
  completed: "Completed", cancelled: "Cancelled", payment_failed: "Payment failed", failed: "Failed",
  refunded: "Refunded", partially_refunded: "Partially refunded", payment_due_on_delivery: "Payment due on delivery",
};

const text = (value: unknown) => value == null ? "" : String(value);
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = (value: unknown) => number(value).toFixed(2);
const human = (value: unknown) => statusLabels[text(value)] ?? text(value).replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
const cleanDate = (value: unknown) => value ? new Date(text(value)).toISOString() : "";
const dateOnly = (value: unknown) => value ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(text(value))) : "";
const timeOnly = (value: unknown) => value ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(text(value))) : "";

function addressParts(order: AnyRecord) {
  const snapshot = order.shipping_address_snapshot && typeof order.shipping_address_snapshot === "object" ? order.shipping_address_snapshot : {};
  const get = (...keys: string[]) => keys.map((key) => snapshot[key]).find((value) => text(value).trim()) ?? "";
  const line1 = text(get("addressLine1", "address", "line1") || order.shipping_address);
  const line2 = text(get("addressLine2", "line2", "buildingDetails"));
  const city = text(get("city") || order.shipping_city);
  const district = text(get("district", "districtArea", "state", "emirate"));
  const postal = text(get("postalCode", "postal_code") || order.shipping_postal_code);
  const country = order.country === "uae" || order.region_code === "AE" ? "United Arab Emirates" : "Sri Lanka";
  const full = [line1, line2, city, district, postal, country].filter(Boolean).join(", ");
  return { line1, line2, city, district, postal, country, full, notes: text(get("deliveryNotes", "customerNote", "note") || order.customer_note) };
}

function paymentInfo(order: AnyRecord, attempts: AnyRecord[], events: AnyRecord[]) {
  const method = text(order.payment_method).toLowerCase();
  const attempt = attempts.filter((item) => item.order_id === order.id).sort((a, b) => text(b.created_at).localeCompare(text(a.created_at)))[0] ?? {};
  const event = events.filter((item) => item.order_id === order.id).sort((a, b) => text(b.created_at).localeCompare(text(a.created_at)))[0] ?? {};
  const provider = text(order.payment_provider || attempt.provider);
  const providerPaymentId = text(order.provider_payment_id || attempt.provider_payment_id);
  const reference = text(order.provider_order_id || attempt.provider_order_id || order.bank_transaction_reference || event.provider_event_id);
  return { method: methodLabels[method] ?? human(method), provider, option: text(order.payment_option || (methodLabels[method] ?? human(method))), reference, providerPaymentId, bankReference: text(order.bank_transaction_reference), date: cleanDate(order.paid_at || attempt.verified_at || event.created_at) };
}

export function buildSalesExportRows(input: { orders: AnyRecord[]; orderItems: AnyRecord[]; posSales: AnyRecord[]; posSaleItems: AnyRecord[]; attempts?: AnyRecord[]; paymentEvents?: AnyRecord[]; refunds?: AnyRecord[]; orderEvents?: AnyRecord[]; profiles?: AnyRecord[] }): SalesExportRow[] {
  const attempts = input.attempts ?? [], paymentEvents = input.paymentEvents ?? [], refunds = input.refunds ?? [], orderEvents = input.orderEvents ?? [], profiles = input.profiles ?? [];
  const online = input.orders.map((order) => {
    const items = input.orderItems.filter((item) => item.order_id === order.id);
    const address = addressParts(order);
    const payment = paymentInfo(order, attempts, paymentEvents);
    const refundAmount = refunds.filter((refund) => refund.order_id === order.id && ["completed", "approved", "processing"].includes(text(refund.status))).reduce((sum, refund) => sum + number(refund.amount), 0);
    const latestEvent = orderEvents.filter((event) => event.order_id === order.id).sort((a, b) => text(b.created_at).localeCompare(text(a.created_at)))[0] ?? {};
    const actor = profiles.find((profile) => profile.id === (latestEvent.actor_id || order.created_by));
    const amountPaid = ["paid", "refunded"].includes(text(order.payment_status)) ? number(order.total_amount) : number(paymentEvents.find((event) => event.order_id === order.id && text(event.payment_status) === "paid")?.amount);
    const itemNames = items.map((item) => `${text(item.products?.name || item.product_name || "Product")} x${number(item.quantity)}`).join(" | ");
    const itemSkus = items.map((item) => `${text(item.products?.sku || item.sku)} x${number(item.quantity)}`).join(" | ");
    const details = items.map((item) => `${text(item.products?.name || "Product")} [${text(item.products?.sku || item.sku)}] x${number(item.quantity)} @ ${money(item.unit_price)} = ${money(item.subtotal)}${item.products?.description ? ` — ${text(item.products.description)}` : ""}`).join(" | ");
    const totalItems = items.reduce((sum, item) => sum + number(item.quantity), 0);
    const total = number(order.total_amount);
    const row: SalesExportRow = {
      "Order ID": text(order.id), "Order Number / Reference": text(order.order_number), "Order Date": dateOnly(order.created_at), "Order Time": timeOnly(order.created_at), "Order Status": human(order.order_status), "Fulfilment Status": human(order.order_status), "Payment Status": human(order.payment_status), "Source": "Online", "Region": order.country === "uae" || order.region_code === "AE" ? "UAE" : "Sri Lanka", "Currency": text(order.currency),
      "Customer Name": text(order.customer_name), "Customer Email": text(order.customer_email), "Customer Phone Number": text(order.customer_phone), "Customer WhatsApp Number": text(order.customer_whatsapp), "Customer/User ID": text(order.customer_user_id),
      "Delivery Address Line 1": address.line1, "Delivery Address Line 2": address.line2, "City": address.city, "District / State / Emirate": address.district, "Postal Code": address.postal, "Country": address.country, "Full Delivery Address": address.full, "Billing Address": text(order.billing_address), "Delivery Notes / Customer Notes": address.notes,
      "Payment Method": payment.method, "Payment Provider": payment.provider, "Payment Option": payment.option, "Payment Reference / Transaction ID": payment.reference, "PayHere Payment ID": payment.providerPaymentId, "Bank Transfer Reference": payment.bankReference, "Payment Date": payment.date,
      "Subtotal": money(order.subtotal_amount), "Discount Amount": money(order.discount_amount), "Coupon Code": text(order.coupon_code), "Shipping Fee": money(order.shipping_fee), "Payment / Processing Fee": money(order.payment_fee), "Tax": money(order.tax_amount), "Order Total": money(total), "Amount Paid": money(amountPaid), "Amount Due": money(Math.max(0, total - amountPaid)), "Refund Amount": money(refundAmount),
      "Total Number of Items": totalItems, "Product Names": itemNames, "Product SKUs": itemSkus, "Quantities": items.map((item) => number(item.quantity)).join(" | "), "Unit Prices": items.map((item) => money(item.unit_price)).join(" | "), "Product Line Totals": items.map((item) => money(item.subtotal)).join(" | "), "Product Details": details,
      "Delivery Method": text(order.shipping_method_name), "Delivery Fee": money(order.shipping_fee), "Courier / Shipping Provider": text(order.courier_name), "Tracking Number": text(order.tracking_number), "Dispatch Status": ["shipped", "delivered"].includes(text(order.order_status)) ? "Dispatched" : "Not dispatched", "Dispatch Date": cleanDate(order.shipped_at), "Delivered Date": cleanDate(order.delivered_at),
      "Created At": cleanDate(order.created_at), "Updated At": cleanDate(order.updated_at), "Created By / Admin": text(actor?.full_name || actor?.email), "Internal Notes": text(latestEvent.note || order.internal_note),
    };
    return row;
  });
  const pos = input.posSales.map((sale) => {
    const items = input.posSaleItems.filter((item) => item.sale_id === sale.id);
    const cashier = profiles.find((profile) => profile.id === sale.cashier_id);
    const region = text(sale.currency) === "AED" ? "UAE" : "Sri Lanka";
    const method = sale.payment_method === "cash" ? "POS Cash" : sale.payment_method === "card" ? "POS Card" : "Bank Transfer";
    return { "Order ID": text(sale.id), "Order Number / Reference": text(sale.sale_number), "Order Date": dateOnly(sale.created_at), "Order Time": timeOnly(sale.created_at), "Order Status": "Completed", "Fulfilment Status": "POS sale", "Payment Status": "Paid", "Source": "POS", "Region": region, "Currency": text(sale.currency || "LKR"), "Customer Name": "", "Customer Email": "", "Customer Phone Number": "", "Customer WhatsApp Number": "", "Customer/User ID": "", "Delivery Address Line 1": "", "Delivery Address Line 2": "", "City": "", "District / State / Emirate": "", "Postal Code": "", "Country": region === "UAE" ? "United Arab Emirates" : "Sri Lanka", "Full Delivery Address": "", "Billing Address": "", "Delivery Notes / Customer Notes": "", "Payment Method": method, "Payment Provider": "", "Payment Option": method, "Payment Reference / Transaction ID": "", "PayHere Payment ID": "", "Bank Transfer Reference": "", "Payment Date": cleanDate(sale.created_at), "Subtotal": money(sale.subtotal), "Discount Amount": money(sale.discount), "Coupon Code": "", "Shipping Fee": "0.00", "Payment / Processing Fee": "0.00", "Tax": "0.00", "Order Total": money(sale.total_amount), "Amount Paid": money(sale.total_amount), "Amount Due": "0.00", "Refund Amount": "0.00", "Total Number of Items": items.reduce((sum, item) => sum + number(item.quantity), 0), "Product Names": items.map((item) => `${text(item.products?.name || "Product")} x${number(item.quantity)}`).join(" | "), "Product SKUs": items.map((item) => `${text(item.products?.sku)} x${number(item.quantity)}`).join(" | "), "Quantities": items.map((item) => number(item.quantity)).join(" | "), "Unit Prices": items.map((item) => money(item.unit_price)).join(" | "), "Product Line Totals": items.map((item) => money(item.subtotal)).join(" | "), "Product Details": items.map((item) => `${text(item.products?.name || "Product")} x${number(item.quantity)} @ ${money(item.unit_price)} = ${money(item.subtotal)}`).join(" | "), "Delivery Method": "POS", "Delivery Fee": "0.00", "Courier / Shipping Provider": "", "Tracking Number": "", "Dispatch Status": "", "Dispatch Date": "", "Delivered Date": "", "Created At": cleanDate(sale.created_at), "Updated At": cleanDate(sale.updated_at), "Created By / Admin": text(cashier?.full_name || cashier?.email), "Internal Notes": "" } as SalesExportRow;
  });
  return [...online, ...pos].sort((a, b) => text(b["Created At"]).localeCompare(text(a["Created At"])));
}

function boundaries(filters: ReportFilters) {
  const range = filters.range ?? "all_time";
  const now = new Date();
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(now);
  const start = (date: string) => new Date(`${date}T00:00:00+05:30`);
  if (range === "today") return [start(day), null] as const;
  if (range === "yesterday") { const date = new Date(start(day).getTime() - 86_400_000); return [date, new Date(date.getTime() + 86_400_000)] as const; }
  if (["7d", "30d", "last_7_days", "last_30_days"].includes(range)) return [new Date(now.getTime() - (range.includes("30") ? 30 : 7) * 86_400_000), null] as const;
  if (range === "this_month") return [new Date(`${day.slice(0, 7)}-01T00:00:00+05:30`), null] as const;
  if (range === "last_month") { const first = new Date(`${day.slice(0, 7)}-01T00:00:00+05:30`); const previous = new Date(first.getTime() - 86_400_000); const begin = new Date(`${previous.toISOString().slice(0, 7)}-01T00:00:00+05:30`); return [begin, first] as const; }
  return [filters.startDate ? start(filters.startDate) : null, filters.endDate ? new Date(start(filters.endDate).getTime() + 86_400_000) : null] as const;
}

export function filterSalesExportRows(rows: SalesExportRow[], filters: ReportFilters) {
  const [from, to] = boundaries(filters);
  const query = text(filters.query).trim().toLowerCase();
  const method = text(filters.paymentMethod || filters.method).toLowerCase();
  return rows.filter((row) => {
    const created = new Date(text(row["Created At"])).getTime();
    const haystack = Object.values(row).join(" ").toLowerCase();
    const region = text(filters.region).toLowerCase();
    const source = text(filters.source).toLowerCase();
    const readableMethod = text(row["Payment Method"]).toLowerCase();
    const methodMatches = !method || method === "all" || (method === "card" ? readableMethod.includes("card") : method === "payhere" ? readableMethod.includes("payhere") : method === "cod" || method === "cash_on_delivery" ? readableMethod.includes("cash on delivery") : readableMethod.replaceAll(" ", "_") === method);
    return (!query || haystack.includes(query)) && (!from || created >= from.getTime()) && (!to || created < to.getTime()) && (!region || region === "all" || text(row.Region).toLowerCase().includes(region === "ae" ? "uae" : region === "lk" ? "sri" : region)) && (!source || source === "all" || text(row.Source).toLowerCase() === source) && methodMatches && (!filters.paymentStatus || filters.paymentStatus === "all" || text(row["Payment Status"]).toLowerCase() === human(filters.paymentStatus).toLowerCase()) && (!filters.orderStatus || filters.orderStatus === "all" || text(row["Order Status"]).toLowerCase() === human(filters.orderStatus).toLowerCase());
  });
}

export function salesRowsToCsv(rows: SalesExportRow[]) {
  const escape = (value: unknown) => `"${text(value).replaceAll("\r\n", "\n").replaceAll("\r", "\n").replaceAll('"', '""')}"`;
  return `\uFEFF${[SALES_EXPORT_COLUMNS, ...rows.map((row) => SALES_EXPORT_COLUMNS.map((column) => row[column] ?? ""))].map((row) => row.map(escape).join(",")).join("\r\n")}\r\n`;
}

export function salesFilename(filters: ReportFilters) {
  const safe = (value: string) => value.replace(/[^0-9A-Za-z-]/g, "-");
  const start = filters.startDate, end = filters.endDate;
  return `yara-sales-report-${start && end ? `${safe(start)}-to-${safe(end)}` : new Date().toISOString().slice(0, 10)}.csv`;
}
