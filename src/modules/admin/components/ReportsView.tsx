"use client";

import { Download } from "lucide-react";
import type { Order, PosSale } from "@/lib/supabase/types";
import { formatMoney } from "../lib/format";

interface PeriodSales { label: string; onlineLkr: number; onlineAed: number; posLkr: number }
interface ReportsViewProps {
  orders: Order[];
  sales: PosSale[];
  bestSellers: Array<{ name: string; sku: string; quantity: number }>;
  monthly: PeriodSales[];
  daily: PeriodSales[];
}

function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }
function downloadCsv(name: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}

export function ReportsView({ orders, sales, bestSellers, monthly, daily }: ReportsViewProps) {
  const validOrders = orders.filter((order) => order.payment_status === "paid" && order.order_status !== "cancelled");
  const onlineLkr = validOrders.filter((order) => order.currency === "LKR").reduce((sum, order) => sum + Number(order.total_amount), 0);
  const onlineAed = validOrders.filter((order) => order.currency === "AED").reduce((sum, order) => sum + Number(order.total_amount), 0);
  const posLkr = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const max = Math.max(1, ...monthly.flatMap((month) => [month.onlineLkr, month.onlineAed, month.posLkr]));
  const exportSales = () => downloadCsv("yara-sales-report.csv", [["Source", "Reference", "Date", "Currency", "Payment", "Amount"], ...orders.map((order) => ["Online", order.order_number, order.created_at, order.currency, order.payment_method, order.total_amount]), ...sales.map((sale) => ["POS", sale.sale_number, sale.created_at, "LKR", sale.payment_method, sale.total_amount])]);

  return <div className="space-y-6">
    <div className="flex justify-end"><button className="staff-button staff-button-secondary" onClick={exportSales}><Download className="h-4 w-4" />Export sales CSV</button></div>
    <section className="grid gap-4 sm:grid-cols-3">
      <article className="staff-panel p-5"><p className="text-xs font-bold uppercase tracking-[.08em] text-slate-500">Online · Sri Lanka</p><p className="staff-metric mt-3 text-3xl font-bold">{formatMoney(onlineLkr)}</p><p className="mt-2 text-sm text-slate-500">LKR orders</p></article>
      <article className="staff-panel p-5"><p className="text-xs font-bold uppercase tracking-[.08em] text-slate-500">Online · UAE</p><p className="staff-metric mt-3 text-3xl font-bold">{formatMoney(onlineAed, "AED")}</p><p className="mt-2 text-sm text-slate-500">AED orders</p></article>
      <article className="staff-panel p-5"><p className="text-xs font-bold uppercase tracking-[.08em] text-slate-500">POS · Sri Lanka</p><p className="staff-metric mt-3 text-3xl font-bold">{formatMoney(posLkr)}</p><p className="mt-2 text-sm text-slate-500">{sales.length} transactions</p></article>
    </section>
    <section className="staff-panel"><div className="border-b border-[var(--staff-line)] p-5"><h2 className="font-bold">Daily sales</h2><p className="mt-1 text-xs text-slate-500">Last seven days, separated by currency</p></div><div className="staff-table-wrap"><table className="staff-table !min-w-[650px]"><thead><tr><th>Date</th><th>Online LKR</th><th>Online AED</th><th>POS LKR</th></tr></thead><tbody>{daily.map((day) => <tr key={day.label}><td className="font-semibold">{day.label}</td><td className="staff-metric">{formatMoney(day.onlineLkr)}</td><td className="staff-metric">{formatMoney(day.onlineAed, "AED")}</td><td className="staff-metric">{formatMoney(day.posLkr)}</td></tr>)}</tbody></table></div></section>
    <section className="staff-panel p-5 sm:p-6"><div className="mb-6"><h2 className="font-bold">Monthly sales</h2><p className="mt-1 text-xs text-slate-500">Last six months; currencies remain separate</p></div><div className="space-y-5" role="img" aria-label="Monthly online LKR, online AED, and POS LKR sales comparison">{monthly.map((month) => <div key={month.label} className="grid grid-cols-[55px_1fr] items-center gap-3"><span className="text-xs font-semibold text-slate-500">{month.label}</span><div className="space-y-1.5"><div className="flex items-center gap-2"><span className="h-3 rounded-full bg-yara-wine" style={{ width: `${Math.max(2, month.onlineLkr / max * 100)}%` }} /><span className="staff-metric text-xs">{formatMoney(month.onlineLkr)}</span></div><div className="flex items-center gap-2"><span className="h-3 rounded-full bg-sky-500" style={{ width: `${Math.max(2, month.onlineAed / max * 100)}%` }} /><span className="staff-metric text-xs">{formatMoney(month.onlineAed, "AED")}</span></div><div className="flex items-center gap-2"><span className="h-3 rounded-full bg-amber-400" style={{ width: `${Math.max(2, month.posLkr / max * 100)}%` }} /><span className="staff-metric text-xs">{formatMoney(month.posLkr)}</span></div></div></div>)}</div><div className="mt-6 flex flex-wrap gap-5 text-xs font-semibold"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-yara-wine" />Online LKR</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-sky-500" />Online AED</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" />POS LKR</span></div></section>
    <section className="staff-panel"><div className="border-b border-[var(--staff-line)] p-5"><h2 className="font-bold">Best selling products</h2></div><div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>Product</th><th>SKU</th><th>Units sold</th></tr></thead><tbody>{bestSellers.map((item) => <tr key={item.sku}><td className="font-semibold">{item.name}</td><td className="font-mono text-xs">{item.sku}</td><td className="staff-metric font-bold">{item.quantity}</td></tr>)}</tbody></table></div></section>
  </div>;
}
