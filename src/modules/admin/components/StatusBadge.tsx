interface StatusBadgeProps { value: string }

const positive = new Set(["active", "paid", "delivered", "restock"]);
const warning = new Set(["pending", "processing", "shipped", "low"]);
const negative = new Set(["inactive", "archived", "cancelled", "failed"]);

export function StatusBadge({ value }: StatusBadgeProps) {
  const tone = positive.has(value) ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : negative.has(value) ? "bg-red-50 text-red-700 ring-red-200" : warning.has(value) ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-slate-50 text-slate-700 ring-slate-200";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${tone}`}>{value.replaceAll("_", " ")}</span>;
}
