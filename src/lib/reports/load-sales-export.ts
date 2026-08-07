import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildSalesExportRows, filterSalesExportRows, type ReportFilters } from "./sales-export";

export async function loadSalesExport(filters: ReportFilters) {
  const supabase = getSupabaseAdminClient();
  const [orders, orderItems, posSales, posSaleItems, attempts, paymentEvents, refunds, orderEvents, profiles] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*,products(name,sku,description)"),
    supabase.from("pos_sales").select("*"),
    supabase.from("pos_sale_items").select("*,products(name,sku,description)"),
    supabase.from("payment_attempts").select("*"),
    supabase.from("payment_events").select("*"),
    supabase.from("refunds").select("*"),
    supabase.from("order_events").select("*"),
    supabase.from("profiles").select("id,full_name,email,role"),
  ]);
  const results = [orders, orderItems, posSales, posSaleItems, attempts, paymentEvents, refunds, orderEvents, profiles];
  const failure = results.find((result) => result.error);
  if (failure?.error) throw new Error(failure.error.message);
  const rows = buildSalesExportRows({ orders: orders.data ?? [], orderItems: orderItems.data ?? [], posSales: posSales.data ?? [], posSaleItems: posSaleItems.data ?? [], attempts: attempts.data ?? [], paymentEvents: paymentEvents.data ?? [], refunds: refunds.data ?? [], orderEvents: orderEvents.data ?? [], profiles: profiles.data ?? [] });
  return filterSalesExportRows(rows, filters);
}
