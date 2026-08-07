export const SALES_EXPORT_COLUMNS = [
  "Order Number", "Order ID", "Order Date", "Order Time", "Order Status", "Payment Status", "Fulfilment Status", "Source", "Region", "Currency",
  "Customer Name", "Customer Phone", "Customer WhatsApp Number", "Customer Email", "Customer ID / User ID",
  "Address Line 1", "Address Line 2", "City", "District / State / Emirate", "Postal Code", "Country", "Full Delivery Address", "Billing Address", "Customer / Delivery Notes",
  "Payment Method", "Payment Option", "Payment Provider", "Payment Transaction ID", "Payment Reference", "PayHere Payment ID", "PayHere Merchant Reference", "Bank Transfer Reference", "Payment Date",
  "Item Count", "Product Names", "Product SKUs", "Quantities", "Unit Prices", "Product Line Totals", "Product Summary",
  "Subtotal", "Discount Amount", "Coupon Code", "Shipping Fee", "Payment / Processing Fee", "Tax", "Final Total", "Amount Paid", "Amount Due", "Refund Amount",
  "Delivery Method", "Courier", "Tracking Number", "Dispatch Status", "Dispatch Date", "Delivered Date",
  "Created At", "Updated At", "Created By / Admin", "Admin/Internal Notes",
  "Settlement Currency", "Settlement Amount", "AED to LKR Rate", "Payment Environment", "Tracking URL", "Estimated Delivery Date", "Refund References", "Order Event History",
] as const;

type AnyRecord = Record<string, any>;
export type ReportFilters = { query?: string; range?: string; startDate?: string; endDate?: string; region?: string; source?: string; paymentMethod?: string; method?: string; paymentStatus?: string; orderStatus?: string };
export type SalesExportRow = Record<(typeof SALES_EXPORT_COLUMNS)[number], string | number>;

const methodLabels: Record<string, string> = {
  cod: "Cash on Delivery", cash_on_delivery: "Cash on Delivery", bank_transfer: "Bank Transfer", payhere: "PayHere Card", card: "PayHere Card",
  cash: "POS Cash", pos_cash: "POS Cash", pos_card: "POS Card", stripe: "Card Payment", koko: "Koko", mintpay: "Mintpay",
};
const providerLabels: Record<string, string> = { payhere: "PayHere", cod: "COD", cash_on_delivery: "COD", bank_transfer: "Bank Transfer", pos: "POS", stripe: "Stripe", cash: "POS" };
const statusLabels: Record<string, string> = {
  unpaid: "Unpaid", pending: "Pending", pending_payment: "Pending payment", awaiting_bank_transfer: "Awaiting bank transfer", awaiting_bank_verification: "Pending Verification", processing: "Processing", paid: "Paid", confirmed: "Confirmed", packed: "Packed", shipped: "Dispatched", delivered: "Delivered", completed: "Completed", cancelled: "Cancelled", payment_failed: "Payment failed", failed: "Failed", refunded: "Refunded", partially_refunded: "Partially refunded", payment_due_on_delivery: "Pending",
};

const text = (value: unknown) => value == null ? "" : String(value);
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = (value: unknown) => number(value).toFixed(2);
const human = (value: unknown) => statusLabels[text(value)] ?? text(value).replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
const validDate = (value: unknown) => { const date = new Date(text(value)); return value && !Number.isNaN(date.getTime()) ? date : null; };
const isoDate = (value: unknown) => { const date = validDate(value); return date ? date.toISOString().slice(0, 10) : ""; };
const isoTime = (value: unknown) => { const date = validDate(value); return date ? date.toISOString().slice(11, 19) : ""; };
const isoDateTime = (value: unknown) => { const date = validDate(value); return date ? date.toISOString().slice(0, 19).replace("T", " ") : ""; };
const asObject = (value: unknown): AnyRecord => value && typeof value === "object" && !Array.isArray(value) ? value as AnyRecord : {};

function addressParts(order: AnyRecord, addresses: AnyRecord[]) {
  const snapshot = asObject(order.shipping_address_snapshot);
  const saved = addresses.filter((address) => address.user_id === order.customer_user_id).sort((a, b) => Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)))[0] ?? {};
  const get = (...keys: string[]) => keys.map((key) => snapshot[key]).find((value) => text(value).trim()) ?? keys.map((key) => saved[key]).find((value) => text(value).trim()) ?? "";
  const line1 = text(get("addressLine1", "address", "line1") || order.shipping_address);
  const line2 = text(get("addressLine2", "address_line_2", "buildingDetails"));
  const city = text(get("city") || order.shipping_city);
  const district = text(get("district", "districtArea", "state", "emirate") || saved.district_area);
  const postal = text(get("postalCode", "postal_code") || order.shipping_postal_code);
  const country = order.country === "uae" || order.region_code === "AE" ? "United Arab Emirates" : "Sri Lanka";
  const full = [line1, line2, city, district, postal, country].filter(Boolean).join(", ");
  const billing = text(snapshot.billingAddress || snapshot.billing_address || order.billing_address);
  const notes = text(snapshot.deliveryNotes || snapshot.customerNote || snapshot.note || order.customer_note);
  return { line1, line2, city, district, postal, country, full, billing, notes, phone: text(snapshot.whatsapp || snapshot.whatsappNumber || order.customer_whatsapp) };
}

function paymentInfo(order: AnyRecord, attempts: AnyRecord[], events: AnyRecord[]) {
  const methodKey = text(order.payment_method).toLowerCase();
  const attempt = attempts.filter((item) => item.order_id === order.id).sort((a, b) => text(b.created_at).localeCompare(text(a.created_at)))[0] ?? {};
  const event = events.filter((item) => item.order_id === order.id).sort((a, b) => text(b.created_at).localeCompare(text(a.created_at)))[0] ?? {};
  const providerKey = text(order.payment_provider || attempt.provider || event.provider || methodKey).toLowerCase();
  const providerPaymentId = text(order.provider_payment_id || attempt.provider_payment_id || event.provider_payment_id);
  const merchantReference = text(order.provider_order_id || attempt.provider_order_id);
  const bankReference = text(order.bank_transaction_reference);
  const reference = bankReference || merchantReference || text(event.provider_event_id);
  const paidAt = order.paid_at || attempt.verified_at || (event.payment_status === "paid" ? event.created_at : "");
  const settlementCurrency = text(attempt.charge_currency || "");
  return { method: methodLabels[methodKey] ?? human(methodKey), option: methodLabels[methodKey] ?? human(methodKey), provider: providerLabels[providerKey] ?? human(providerKey), transactionId: providerPaymentId, reference, payHereId: providerKey === "payhere" ? providerPaymentId : "", merchantReference, bankReference, date: isoDateTime(paidAt), settlementCurrency, settlementAmount: attempt.charge_amount, rate: attempt.locked_exchange_rate, environment: attempt.provider_environment };
}

function emptyRow(): SalesExportRow { return Object.fromEntries(SALES_EXPORT_COLUMNS.map((column) => [column, ""])) as SalesExportRow; }

export function buildSalesExportRows(input: { orders: AnyRecord[]; orderItems: AnyRecord[]; posSales: AnyRecord[]; posSaleItems: AnyRecord[]; attempts?: AnyRecord[]; paymentEvents?: AnyRecord[]; refunds?: AnyRecord[]; orderEvents?: AnyRecord[]; profiles?: AnyRecord[]; addresses?: AnyRecord[] }): SalesExportRow[] {
  const attempts = input.attempts ?? [], paymentEvents = input.paymentEvents ?? [], refunds = input.refunds ?? [], orderEvents = input.orderEvents ?? [], profiles = input.profiles ?? [], addresses = input.addresses ?? [];
  const online = input.orders.map((order) => {
    const items = input.orderItems.filter((item) => item.order_id === order.id);
    const address = addressParts(order, addresses); const payment = paymentInfo(order, attempts, paymentEvents);
    const events = orderEvents.filter((event) => event.order_id === order.id).sort((a, b) => text(a.created_at).localeCompare(text(b.created_at)));
    const latestEvent = events.at(-1) ?? {}; const actor = profiles.find((profile) => profile.id === (latestEvent.actor_id || order.created_by));
    const refundRows = refunds.filter((refund) => refund.order_id === order.id && ["completed", "approved", "processing"].includes(text(refund.status)));
    const refundAmount = refundRows.reduce((sum, refund) => sum + number(refund.amount), 0); const total = number(order.total_amount);
    const amountPaid = ["paid", "refunded"].includes(text(order.payment_status)) ? total : number(paymentEvents.filter((event) => event.order_id === order.id && event.payment_status === "paid").reduce((sum, event) => sum + number(event.amount), 0));
    const names = items.map((item) => text(item.products?.name || item.product_name || "Product")); const skus = items.map((item) => text(item.products?.sku || item.sku));
    const summary = items.map((item, index) => `${names[index]} x${number(item.quantity)}`).join(" | ");
    const row = emptyRow(); Object.assign(row, {
      "Order Number": text(order.order_number), "Order ID": text(order.id), "Order Date": isoDate(order.created_at), "Order Time": isoTime(order.created_at), "Order Status": human(order.order_status), "Payment Status": human(order.payment_status), "Fulfilment Status": human(order.order_status), "Source": "Online", "Region": order.country === "uae" || order.region_code === "AE" ? "UAE" : "Sri Lanka", "Currency": text(order.currency),
      "Customer Name": text(order.customer_name || asObject(order.shipping_address_snapshot).name), "Customer Phone": text(order.customer_phone || asObject(order.shipping_address_snapshot).phone), "Customer WhatsApp Number": address.phone, "Customer Email": text(order.customer_email || asObject(order.shipping_address_snapshot).email), "Customer ID / User ID": text(order.customer_user_id),
      "Address Line 1": address.line1, "Address Line 2": address.line2, "City": address.city, "District / State / Emirate": address.district, "Postal Code": address.postal, "Country": address.country, "Full Delivery Address": address.full, "Billing Address": address.billing, "Customer / Delivery Notes": address.notes,
      "Payment Method": payment.method, "Payment Option": payment.option, "Payment Provider": payment.provider, "Payment Transaction ID": payment.transactionId, "Payment Reference": payment.reference, "PayHere Payment ID": payment.payHereId, "PayHere Merchant Reference": payment.merchantReference, "Bank Transfer Reference": payment.bankReference, "Payment Date": payment.date,
      "Item Count": items.reduce((sum, item) => sum + number(item.quantity), 0), "Product Names": names.join(" | "), "Product SKUs": skus.join(" | "), "Quantities": items.map((item) => number(item.quantity)).join(" | "), "Unit Prices": items.map((item) => money(item.unit_price)).join(" | "), "Product Line Totals": items.map((item) => money(item.subtotal)).join(" | "), "Product Summary": summary,
      "Subtotal": money(order.subtotal_amount), "Discount Amount": money(order.discount_amount), "Coupon Code": text(order.coupon_code), "Shipping Fee": money(order.shipping_fee), "Payment / Processing Fee": money(order.payment_fee), "Tax": money(order.tax_amount), "Final Total": money(total), "Amount Paid": money(amountPaid), "Amount Due": money(Math.max(0, total - amountPaid)), "Refund Amount": money(refundAmount),
      "Delivery Method": text(order.shipping_method_name), "Courier": text(order.courier_name), "Tracking Number": text(order.tracking_number), "Dispatch Status": order.shipped_at || ["shipped", "delivered"].includes(text(order.order_status)) ? "Dispatched" : "Not dispatched", "Dispatch Date": isoDateTime(order.shipped_at), "Delivered Date": isoDateTime(order.delivered_at),
      "Created At": isoDateTime(order.created_at), "Updated At": isoDateTime(order.updated_at), "Admin/Internal Notes": text(latestEvent.note || order.internal_note), "Settlement Currency": payment.settlementCurrency, "Settlement Amount": payment.settlementAmount == null ? "" : money(payment.settlementAmount), "AED to LKR Rate": payment.rate == null ? "" : money(payment.rate), "Payment Environment": text(payment.environment), "Tracking URL": text(order.tracking_url), "Estimated Delivery Date": isoDate(order.estimated_delivery_date), "Refund References": refundRows.map((refund) => text(refund.provider_reference)).filter(Boolean).join(" | "), "Order Event History": events.map((event) => `${isoDateTime(event.created_at)} ${human(event.to_status)}${event.note ? `: ${text(event.note)}` : ""}`).join(" | "),
      "Created By / Admin": text(actor?.full_name || actor?.email),
    });
    return row;
  });
  const pos = input.posSales.map((sale) => { const items = input.posSaleItems.filter((item) => item.sale_id === sale.id); const cashier = profiles.find((profile) => profile.id === sale.cashier_id); const region = text(sale.currency) === "AED" ? "UAE" : "Sri Lanka"; const method = sale.payment_method === "cash" ? "POS Cash" : sale.payment_method === "card" ? "POS Card" : "Bank Transfer"; const row = emptyRow(); Object.assign(row, { "Order Number": text(sale.sale_number), "Order ID": text(sale.id), "Order Date": isoDate(sale.created_at), "Order Time": isoTime(sale.created_at), "Order Status": "Completed", "Payment Status": "Paid", "Fulfilment Status": "POS sale", "Source": "POS", "Region": region, "Currency": text(sale.currency || "LKR"), "Payment Method": method, "Payment Option": method, "Payment Provider": "POS", "Payment Date": isoDateTime(sale.created_at), "Item Count": items.reduce((sum, item) => sum + number(item.quantity), 0), "Product Names": items.map((item) => text(item.products?.name || "Product")).join(" | "), "Product SKUs": items.map((item) => text(item.products?.sku)).join(" | "), "Quantities": items.map((item) => number(item.quantity)).join(" | "), "Unit Prices": items.map((item) => money(item.unit_price)).join(" | "), "Product Line Totals": items.map((item) => money(item.subtotal)).join(" | "), "Product Summary": items.map((item) => `${text(item.products?.name || "Product")} x${number(item.quantity)}`).join(" | "), "Subtotal": money(sale.subtotal), "Discount Amount": money(sale.discount), "Shipping Fee": "0.00", "Payment / Processing Fee": "0.00", "Tax": "0.00", "Final Total": money(sale.total_amount), "Amount Paid": money(sale.total_amount), "Amount Due": "0.00", "Refund Amount": "0.00", "Delivery Method": "POS", "Created At": isoDateTime(sale.created_at), "Updated At": isoDateTime(sale.updated_at), "Created By / Admin": text(cashier?.full_name || cashier?.email) }); return row; });
  return [...online, ...pos].sort((a, b) => text(b["Created At"]).localeCompare(text(a["Created At"]))).map((row) => { const normalized = emptyRow(); for (const column of SALES_EXPORT_COLUMNS) normalized[column] = row[column] ?? ""; return normalized; });
}

function boundaries(filters: ReportFilters) { const range = filters.range ?? "all_time"; const now = new Date(); const day = now.toISOString().slice(0, 10); const start = (date: string) => new Date(`${date}T00:00:00Z`); if (range === "today") return [start(day), null] as const; if (range === "yesterday") { const end = start(day); return [new Date(end.getTime() - 86_400_000), end] as const; } if (["7d", "last_7_days"].includes(range)) return [new Date(now.getTime() - 7 * 86_400_000), null] as const; if (["30d", "last_30_days"].includes(range)) return [new Date(now.getTime() - 30 * 86_400_000), null] as const; if (range === "this_month") return [new Date(`${day.slice(0, 7)}-01T00:00:00Z`), null] as const; if (range === "last_month") { const first = new Date(`${day.slice(0, 7)}-01T00:00:00Z`); const previous = new Date(first.getTime() - 86_400_000); return [new Date(`${previous.toISOString().slice(0, 7)}-01T00:00:00Z`), first] as const; } return [filters.startDate ? start(filters.startDate) : null, filters.endDate ? new Date(start(filters.endDate).getTime() + 86_400_000) : null] as const; }

export function filterSalesExportRows(rows: SalesExportRow[], filters: ReportFilters) { const [from, to] = boundaries(filters); const query = text(filters.query).trim().toLowerCase(); const method = text(filters.paymentMethod || filters.method).toLowerCase(); return rows.filter((row) => { const created = validDate(row["Created At"])?.getTime() ?? 0; const haystack = Object.values(row).join(" ").toLowerCase(); const region = text(filters.region).toLowerCase(); const source = text(filters.source).toLowerCase(); const readableMethod = text(row["Payment Method"]).toLowerCase(); const methodMatches = !method || method === "all" || (method === "card" ? readableMethod.includes("card") : method === "payhere" ? readableMethod.includes("payhere") : method === "cod" || method === "cash_on_delivery" ? readableMethod.includes("cash on delivery") : readableMethod.replaceAll(" ", "_") === method); return (!query || haystack.includes(query)) && (!from || created >= from.getTime()) && (!to || created < to.getTime()) && (!region || region === "all" || text(row.Region).toLowerCase().includes(region === "ae" ? "uae" : region === "lk" ? "sri" : region)) && (!source || source === "all" || text(row.Source).toLowerCase() === source) && methodMatches && (!filters.paymentStatus || filters.paymentStatus === "all" || text(row["Payment Status"]).toLowerCase() === human(filters.paymentStatus).toLowerCase()) && (!filters.orderStatus || filters.orderStatus === "all" || text(row["Order Status"]).toLowerCase() === human(filters.orderStatus).toLowerCase()); }); }

export function salesRowsToCsv(rows: SalesExportRow[]) { const escape = (value: unknown) => `"${text(value).replaceAll("\r\n", "\n").replaceAll("\r", "\n").replaceAll('"', '""')}"`; return `\uFEFF${[SALES_EXPORT_COLUMNS, ...rows.map((row) => SALES_EXPORT_COLUMNS.map((column) => row[column] ?? ""))].map((row) => row.map(escape).join(",")).join("\r\n")}\r\n`; }
export function salesFilename(filters: ReportFilters) { const safe = (value: string) => value.replace(/[^0-9A-Za-z-]/g, "-"); const start = filters.startDate, end = filters.endDate; return `yara-sales-report-${start && end ? `${safe(start)}-to-${safe(end)}` : new Date().toISOString().slice(0, 10)}.csv`; }
