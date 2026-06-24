import Link from "next/link";
import { requireStaff } from "@/lib/supabase/auth";
import { formatDate, formatMoney } from "@/modules/admin/lib/format";
import { getPosSales } from "./data";

export async function PosHistoryPage() {
  await requireStaff("/pos/history");
  const sales = await getPosSales();
  return <main className="mx-auto max-w-6xl p-4 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-yara-wine">Point of sale</p><h1 className="mt-2 text-2xl font-bold">Sales history</h1></div><Link href="/pos" className="staff-button staff-button-primary">Back to terminal</Link></div><section className="staff-panel"><div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>Sale</th><th>Date</th><th>Cashier</th><th>Payment</th><th>Total</th></tr></thead><tbody>{sales.map((sale) => <tr key={sale.id}><td className="font-mono text-xs font-bold">{sale.sale_number}</td><td>{formatDate(sale.created_at, true)}</td><td>{sale.profiles?.full_name || "Staff"}</td><td className="capitalize">{sale.payment_method.replaceAll("_", " ")}</td><td className="staff-metric font-bold">{formatMoney(Number(sale.total_amount), sale.currency)}</td></tr>)}</tbody></table></div></section></main>;
}
