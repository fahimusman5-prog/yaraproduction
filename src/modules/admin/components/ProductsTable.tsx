"use client";

import { Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/supabase/types";
import { PriceDisplay } from "@/components/PriceDisplay";
import { archiveProductAction } from "../actions";
import { formatMoney } from "../lib/format";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";

const formatLkr = (price: number) => formatMoney(price);
const formatAed = (price: number) => formatMoney(price, "AED");

export function ProductsTable({ products }: { products: Product[] }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all");
  const rows = useMemo(() => products.filter((p) => (status === "all" || p.status === status) && `${p.name} ${p.sku} ${p.barcode ?? ""}`.toLowerCase().includes(query.toLowerCase())), [products, query, status]);
  return <div className="staff-panel"><div className="flex flex-col gap-3 border-b border-[var(--staff-line)] p-4 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Search products</span><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="staff-input pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, SKU, or barcode" /></label><label><span className="sr-only">Filter by status</span><select className="staff-input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label></div>{rows.length ? <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>Product</th><th>SKU / barcode</th><th>Pricing</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((product) => <tr key={product.id}><td><div className="flex items-center gap-3">{product.image_url ? <img src={product.image_url} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="grid h-11 w-11 place-items-center rounded-lg bg-yara-rose text-xs font-bold text-yara-wine">Y</span>}<div><p className="font-semibold">{product.name}</p><p className="text-xs text-slate-500">{product.categories?.name ?? "Uncategorized"}</p></div></div></td><td><p className="font-mono text-xs">{product.sku}</p><p className="mt-1 font-mono text-xs text-slate-400">{product.barcode || "—"}</p></td><td><PriceDisplay sellingPrice={Number(product.price_lkr)} originalPrice={product.original_price_lkr === null ? null : Number(product.original_price_lkr)} format={formatLkr} sellingClassName="text-sm text-slate-900" originalClassName="text-xs text-slate-500" /><PriceDisplay sellingPrice={Number(product.price_aed)} originalPrice={product.original_price_aed === null ? null : Number(product.original_price_aed)} format={formatAed} sellingClassName="mt-1 text-xs text-slate-500" originalClassName="text-xs text-slate-400" /></td><td><p className="staff-metric font-semibold">{product.stock_quantity}</p>{product.stock_quantity <= product.low_stock_alert && <p className="text-xs font-semibold text-amber-700">Low stock</p>}</td><td><StatusBadge value={product.status} /></td><td><div className="flex gap-2"><Link href={`/admin/products/${product.id}/edit`} className="staff-button staff-button-secondary" aria-label={`Edit ${product.name}`}><Pencil className="h-4 w-4" /></Link>{product.status !== "archived" && <ConfirmActionButton action={archiveProductAction.bind(null, product.id)} label="Archive" title={`Archive ${product.name}?`} detail="The product will be hidden from active sales but retained for order and stock history." />}</div></td></tr>)}</tbody></table></div> : <EmptyState title="No products found" detail="Adjust the search or add a new product." />}</div>;
}
