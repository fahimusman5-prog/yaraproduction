import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSalesExport } from "@/lib/reports/load-sales-export";
import { salesFilename, salesRowsToCsv, type ReportFilters } from "@/lib/reports/sales-export";

const schema = z.object({
  scope: z.enum(["current_filter", "selected_orders", "all_orders"]).default("current_filter"),
  format: z.literal("csv").default("csv"),
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export async function POST(request: Request) {
  await requireAdmin("/admin/reports");
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
  let rows;
  try {
    rows = await loadSalesExport(parsed.data.filters as ReportFilters);
  } catch (error) {
    console.error("[admin-reports-export] unable to load canonical sales data", error);
    return NextResponse.json({ error: "Sales data could not be loaded." }, { status: 500 });
  }
  const supabase = getSupabaseAdminClient();
  const rpc = supabase.rpc.bind(supabase) as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc("log_report_export", {
    p_scope: parsed.data.scope,
    p_format: parsed.data.format,
    p_filters: parsed.data.filters,
    p_row_count: rows.length,
  });
  if (error) return NextResponse.json({ error: "Export audit could not be recorded." }, { status: 500 });
  return new Response(salesRowsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${salesFilename(parsed.data.filters as ReportFilters)}"`,
      "Cache-Control": "no-store",
      "X-Report-Export-Id": String(data ?? ""),
    },
  });
}
