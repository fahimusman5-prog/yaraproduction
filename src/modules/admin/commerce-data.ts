import "server-only";
import { requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getCommerceOperations() {
  await requireStaff("/admin/commerce");
  const supabase = getSupabaseAdminClient();
  const [
    zones,
    methods,
    productRates,
    shippingAudit,
    products,
    categories,
    coupons,
    returns,
    refunds,
    deletionRequests,
  ] =
    await Promise.all([
      supabase
        .from("shipping_zones")
        .select("*")
        .is("archived_at", null)
        .order("country_code")
        .order("sort_order"),
      supabase
        .from("shipping_methods")
        .select("*,shipping_zones(name,country_code)")
        .is("archived_at", null)
        .order("sort_order"),
      supabase
        .from("shipping_product_rates")
        .select("*,shipping_methods(name,currency),products(name,sku)")
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("shipping_audit_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("products")
        .select("id,name,sku,status")
        .order("name"),
      supabase.from("categories").select("id,name").order("name"),
      supabase
        .from("coupons")
        .select("*,coupon_redemptions(count)")
        .order("created_at", { ascending: false }),
      supabase
        .from("return_requests")
        .select(
          "*,orders(order_number,currency,total_amount),return_items(id,quantity,order_items(product_id,products(name,sku)))",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("refunds")
        .select("*,orders(order_number)")
        .order("created_at", { ascending: false }),
      supabase
        .from("account_deletion_requests")
        .select("*")
        .in("status", ["pending", "processing", "failed"])
        .order("requested_at", { ascending: true }),
    ]);
  const failure = [
    zones,
    methods,
    productRates,
    shippingAudit,
    products,
    categories,
    coupons,
    returns,
    refunds,
    deletionRequests,
  ].find((result) => result.error);
  if (failure?.error)
    throw new Error(
      "Commerce operations could not be loaded. Apply the latest migrations.",
    );
  return {
    zones: zones.data ?? [],
    methods: methods.data ?? [],
    productRates: productRates.data ?? [],
    shippingAudit: shippingAudit.data ?? [],
    products: products.data ?? [],
    categories: categories.data ?? [],
    coupons: coupons.data ?? [],
    returns: returns.data ?? [],
    refunds: refunds.data ?? [],
    deletionRequests: deletionRequests.data ?? [],
  };
}
