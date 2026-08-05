import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  scope: z.enum(["current_filter", "selected_orders", "all_orders"]),
  format: z.enum(["xlsx", "csv", "pdf", "json"]),
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  rowCount: z.number().int().min(0).max(100_000),
});

export async function POST(request: Request) {
  await requireAdmin("/admin/reports");
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
  const rpc = getSupabaseAdminClient().rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc("log_report_export", {
    p_scope: parsed.data.scope,
    p_format: parsed.data.format,
    p_filters: parsed.data.filters,
    p_row_count: parsed.data.rowCount,
  });
  if (error) return NextResponse.json({ error: "Export audit could not be recorded." }, { status: 500 });
  return NextResponse.json({ id: data });
}
