import { getReportsData } from "./data";
import { PageHeader } from "./components/PageHeader";
import { ReportsView, type ReportSnapshot } from "./components/ReportsView";

const ORDER_STATUSES = ["draft", "pending", "pending_payment", "awaiting_bank_transfer", "confirmed", "paid", "processing", "packed", "shipped", "delivered", "completed", "cancelled", "payment_failed", "refunded", "returned"];
const PAYMENT_METHODS = ["cash_on_delivery", "cod", "payhere", "card", "bank_transfer", "stripe", "pos", "koko"];
const TZ = "Asia/Colombo";

function dayKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
function money(value: number) { return Math.round(value * 100) / 100; }

export async function AdminReportsPage() {
  const { orders, orderItems } = await getReportsData();
  const rows = orders as Array<Record<string, any>>;
  const items = orderItems as Array<Record<string, any>>;
  const itemByOrder = new Map<string, Array<Record<string, any>>>();
  for (const item of items) itemByOrder.set(item.order_id, [...(itemByOrder.get(item.order_id) ?? []), item]);
  const total = (key: string, source = rows) => money(source.reduce((sum, row) => sum + Number(row[key] ?? 0), 0));
  const revenueRows = rows.filter((row) => row.order_status !== "cancelled" && row.payment_status !== "failed");
  const statuses = Object.fromEntries(ORDER_STATUSES.map((status) => [status, rows.filter((row) => row.order_status === status).length]));
  const payments = PAYMENT_METHODS.map((method) => {
    const matching = rows.filter((row) => String(row.payment_method).toLowerCase() === method);
    return { method, orders: matching.length, revenue: total("total_amount", matching) };
  });
  const now = new Date();
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const within = (start: Date) => rows.filter((row) => new Date(row.created_at) >= start);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const salesPeriods = { today: rows.filter((row) => dayKey(row.created_at) === today), yesterday: rows.filter((row) => dayKey(row.created_at) === yesterday), week: within(startOfWeek), month: within(startOfMonth), year: within(startOfYear), lifetime: rows };
  const dateSeries = Array.from({ length: 14 }, (_, index) => { const date = new Date(now); date.setDate(now.getDate() - (13 - index)); const key = dayKey(date); const matching = revenueRows.filter((row) => dayKey(row.created_at) === key); return { label: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date), value: total("total_amount", matching), orders: matching.length }; });
  const monthSeries = Array.from({ length: 12 }, (_, index) => { const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1); const matching = revenueRows.filter((row) => { const created = new Date(row.created_at); return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth(); }); return { label: new Intl.DateTimeFormat("en", { month: "short" }).format(date), value: total("total_amount", matching), orders: matching.length }; });
  const productMap = new Map<string, { name: string; sku: string; quantity: number; revenue: number; category: string; concern: string }>();
  for (const item of items) { const product = item.products ?? {}; const key = item.product_id ?? product.sku ?? item.id; const current = productMap.get(key) ?? { name: product.name ?? "Product", sku: product.sku ?? "—", quantity: 0, revenue: 0, category: product.categories?.name ?? "Uncategorised", concern: product.product_skin_concerns?.[0]?.skin_concerns?.name ?? "Unassigned" }; current.quantity += Number(item.quantity ?? 0); current.revenue += Number(item.subtotal ?? 0); productMap.set(key, current); }
  const products = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const group = (key: "category" | "concern") => [...productMap.values()].reduce<Record<string, number>>((result, item) => { result[item[key]] = money((result[item[key]] ?? 0) + item.revenue); return result; }, {});
  const customerMap = new Map<string, { name: string; orders: number; revenue: number }>();
  for (const row of rows) { const key = row.customer_email || row.customer_phone || row.customer_name; const current = customerMap.get(key) ?? { name: row.customer_name || "Guest customer", orders: 0, revenue: 0 }; current.orders += 1; current.revenue += Number(row.total_amount ?? 0); customerMap.set(key, current); }
  const customers = [...customerMap.values()].sort((a, b) => b.revenue - a.revenue);
  const countries = ["sri-lanka", "uae"].map((country) => { const matching = revenueRows.filter((row) => row.country === country); return { country, orders: matching.length, revenue: total("total_amount", matching), average: matching.length ? money(total("total_amount", matching) / matching.length) : 0 }; });
  const orderRows = rows.slice(0, 1000).map((row) => ({ ...row, items: itemByOrder.get(row.id) ?? [] }));
  const snapshot: ReportSnapshot = { orders: orderRows, totals: { orders: rows.length, revenue: total("total_amount", revenueRows), grossRevenue: total("subtotal_amount"), shipping: total("shipping_fee"), discounts: total("discount_amount"), fees: total("payment_fee"), average: rows.length ? money(total("total_amount", revenueRows) / rows.length) : 0 }, salesPeriods: Object.fromEntries(Object.entries(salesPeriods).map(([key, value]) => [key, { orders: value.length, revenue: total("total_amount", value) }])), statuses, payments, countries, products, categoryRevenue: group("category"), concernRevenue: group("concern"), daily: dateSeries, monthly: monthSeries, customers: { newCount: rows.filter((row) => row.customer_user_id && rows.findIndex((candidate) => candidate.customer_user_id === row.customer_user_id) === rows.indexOf(row)).length, returningCount: [...customerMap.values()].filter((customer) => customer.orders > 1).length, topSpender: customers[0] ?? null, mostOrders: [...customers].sort((a, b) => b.orders - a.orders)[0] ?? null } };
  return <><PageHeader eyebrow="Intelligence" title="Sales analytics" description="A live operating view of every order, payment, customer, and product signal across YARA." /><ReportsView snapshot={snapshot} /></>;
}
