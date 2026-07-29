import "server-only";
import { requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getCommerceOperations() {
  await requireStaff("/admin/commerce");
  const supabase = getSupabaseAdminClient();
  const [zones, methods, coupons, returns, refunds] = await Promise.all([
    supabase.from("shipping_zones").select("*").order("country_code").order("sort_order"),
    supabase.from("shipping_methods").select("*,shipping_zones(name,country_code)").order("sort_order"),
    supabase.from("coupons").select("*,coupon_redemptions(count)").order("created_at", { ascending: false }),
    supabase.from("return_requests").select("*,orders(order_number,currency,total_amount),return_items(id,quantity,order_items(product_id,products(name,sku)))").order("created_at", { ascending: false }),
    supabase.from("refunds").select("*,orders(order_number)").order("created_at", { ascending: false }),
  ]);
  const failure = [zones, methods, coupons, returns, refunds].find((result) => result.error);
  if (failure?.error) throw new Error("Commerce operations could not be loaded. Apply the latest migrations.");
  return { zones: zones.data ?? [], methods: methods.data ?? [], coupons: coupons.data ?? [], returns: returns.data ?? [], refunds: refunds.data ?? [] };
}
