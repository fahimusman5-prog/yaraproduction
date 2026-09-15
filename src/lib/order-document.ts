import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getShippingLabelPaymentState } from "@/lib/shipping-label/normalizeOrderForLabel";

export type OrderDocumentItem = { name: string; sku?: string; quantity: number; unitPrice: number; subtotal: number };
export type OrderDocumentData = {
  id: string;
  orderNumber: string;
  createdAt?: string;
  customerName: string;
  phone?: string;
  email?: string;
  country?: string;
  currency: string;
  addressLines: string[];
  items: OrderDocumentItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  paymentFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  payment: ReturnType<typeof getShippingLabelPaymentState>;
  courier?: string;
  trackingNumber?: string;
};

type UnknownRecord = Record<string, unknown>;
const text = (value: unknown) => (typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim());
const record = (value: unknown): UnknownRecord => value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

function countryName(value: unknown) {
  const country = text(value).toLowerCase();
  if (country === "sri-lanka" || country === "sri lanka") return "Sri Lanka";
  if (country === "uae" || country === "united arab emirates") return "United Arab Emirates";
  return text(value);
}

export function normalizeOrderDocument(order: UnknownRecord, rawItems: UnknownRecord[] = []): OrderDocumentData {
  const snapshot = record(order.shipping_address_snapshot);
  const customerName = text(snapshot.name) || text(order.customer_name) || "Customer details unavailable";
  const country = countryName(snapshot.country || order.country);
  const address = text(snapshot.address) || text(order.shipping_address);
  const address2 = text(snapshot.address2) || text(snapshot.addressLine2) || text(snapshot.address_line_2);
  const city = text(snapshot.city) || text(order.shipping_city);
  const province = text(snapshot.province) || text(snapshot.state) || text(snapshot.emirate) || text(snapshot.district);
  const postal = text(snapshot.postalCode) || text(snapshot.postal_code) || text(order.shipping_postal_code);
  const items = rawItems.map((item) => {
    const product = record(item.products);
    return { name: text(product.name) || "YARA product", sku: text(product.sku) || undefined, quantity: Math.max(1, Number(item.quantity) || 1), unitPrice: Number(item.unit_price) || 0, subtotal: Number(item.subtotal) || 0 };
  });
  return {
    id: text(order.id), orderNumber: text(order.order_number) || text(order.id), createdAt: text(order.created_at) || undefined,
    customerName, phone: text(snapshot.phone) || text(order.customer_phone) || undefined, email: text(snapshot.email) || text(order.customer_email) || undefined,
    country, currency: text(order.currency), addressLines: unique([address, address2, [city, province, postal].filter(Boolean).join(" "), country]), items,
    subtotal: Number(order.subtotal_amount) || 0, discount: Number(order.discount_amount) || 0, shipping: Number(order.shipping_fee) || 0, paymentFee: Number(order.payment_fee) || 0, total: Number(order.total_amount) || 0,
    paymentMethod: text(order.payment_method), paymentStatus: text(order.payment_status), orderStatus: text(order.order_status), payment: getShippingLabelPaymentState(order),
    courier: text(order.courier_name) || undefined, trackingNumber: text(order.tracking_number) || undefined,
  };
}

export async function loadOrderDocument(orderId: string): Promise<OrderDocumentData | null> {
  const supabase = getSupabaseAdminClient();
  const [orderResult, itemsResult] = await Promise.all([
    supabase.from("orders").select("id,order_number,created_at,customer_name,customer_email,customer_phone,shipping_address,shipping_city,shipping_postal_code,shipping_address_snapshot,country,currency,subtotal_amount,discount_amount,shipping_fee,payment_fee,total_amount,payment_method,payment_status,order_status,courier_name,tracking_number").eq("id", orderId).maybeSingle(),
    supabase.from("order_items").select("quantity,unit_price,subtotal,products(name,sku)").eq("order_id", orderId).order("id"),
  ]);
  if (orderResult.error || itemsResult.error || !orderResult.data) return null;
  return normalizeOrderDocument(orderResult.data as UnknownRecord, (itemsResult.data ?? []) as UnknownRecord[]);
}

export async function loadOrderDocumentByNumber(orderNumber: string) {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.from("orders").select("id").eq("order_number", orderNumber).maybeSingle();
  if (result.error || !result.data) return null;
  return loadOrderDocument(text((result.data as UnknownRecord).id));
}
