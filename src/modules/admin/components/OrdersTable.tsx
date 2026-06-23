"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Order } from "@/lib/supabase/types";
import { formatDate, formatMoney } from "../lib/format";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [country, setCountry] = useState("all");
  const rows = useMemo(() => orders.filter((o) => (status === "all" || o.order_status === status) && (country === "all" || o.country === country) && `${o.order_number} ${o.customer_name} ${o.customer_email} ${o.customer_phone}`.toLowerCase().includes(query.toLowerCase())), [orders, query, status, country]);
  return <section className="staff-panel"><div className="grid gap-3 border-b border-[var(--staff-line)] p-4 md:grid-cols-[1fr_190px_170px]"><label className="relative"><span className="sr-only">Search orders</span><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="staff-input pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order, customer, email, or phone" /></label><label><span className="sr-only">Order status</span><select className="staff-input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{["pending", "paid", "processing", "shipped", "delivered", "cancelled"].map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="sr-only">Country</span><select className="staff-input" value={country} onChange={(e) => setCountry(e.target.value)}><option value="all">All countries</option><option value="sri-lanka">Sri Lanka</option><option value="uae">UAE</option></select></label></div>{rows.length ? <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>Order</th><th>Customer</th><th>Country</th><th>Payment</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>{rows.map((order) => <tr key={order.id}><td><Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-bold text-yara-wine">{order.order_number}</Link></td><td><p className="font-semibold">{order.customer_name}</p><p className="text-xs text-slate-500">{order.customer_email}</p></td><td className="capitalize">{order.country.replace("-", " ")}</td><td><p className="capitalize">{order.payment_method.replaceAll("_", " ")}</p><StatusBadge value={order.payment_status} /></td><td className="staff-metric font-semibold">{formatMoney(Number(order.total_amount), order.currency)}</td><td><StatusBadge value={order.order_status} /></td><td className="text-xs text-slate-500">{formatDate(order.created_at, true)}</td></tr>)}</tbody></table></div> : <EmptyState title="No orders found" detail="Try a different search or filter." />}</section>;
}
