import "server-only";
import { requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getCommerceOperations() {
  const staff = await requireStaff("/admin/commerce");
  const supabase = getSupabaseAdminClient();
  const [
    zones,
    deliverySettings,
    paymentSettings,
    exchangeRates,
    methods,
    shippingAudit,
    products,
    categories,
    coupons,
    returns,
    refunds,
    deletionRequests,
  ] =
    await Promise.all([
      Promise.resolve({ data: [], error: null }),
      staff.profile.role === "admin"
        ? supabase
            .from("delivery_settings")
            .select("*")
            .order("region_code")
        : Promise.resolve({ data: [], error: null }),
      staff.profile.role === "admin"
        ? supabase
            .from("exchange_rates")
            .select("*")
            .eq("source_currency", "AED")
            .eq("target_currency", "USD")
            .order("effective_from", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
      staff.profile.role === "admin"
        ? supabase
            .from("payment_method_settings")
            .select("*")
<<<<<<< Updated upstream
            .eq("payment_method", "bank_transfer")
=======
            .neq("payment_method", "mintpay")
>>>>>>> Stashed changes
            .order("region_code")
        : Promise.resolve({ data: [], error: null }),
      Promise.resolve({ data: [], error: null }),
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
          "*,orders(order_number,currency,total_amount,payment_status),return_items(id,quantity,reason,customer_note,approved_quantity,rejected_quantity,received_quantity,inspection_outcome,order_items(id,product_id,quantity,unit_price,subtotal,shipping_fee,refunded_quantity,products(name,sku))),return_images(id,storage_path,original_filename,content_type,size_bytes)",
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
    deliverySettings,
    paymentSettings,
    exchangeRates,
    methods,
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
  const returnRows = (returns.data ?? []) as Array<{
    return_images?: Array<{ storage_path: string }>;
    [key: string]: unknown;
  }>;
  const evidencePaths = returnRows.flatMap((request) =>
    (request.return_images ?? []).map((image) => image.storage_path),
  );
  const signedEvidence = evidencePaths.length
    ? await supabase.storage
        .from("return-evidence")
        .createSignedUrls(evidencePaths, 15 * 60)
    : { data: [], error: null };
  if (signedEvidence.error)
    throw new Error("Private return evidence could not be authorized.");
  const signedByPath = new Map(
    (signedEvidence.data ?? []).map((item) => [item.path, item.signedUrl]),
  );
  const returnsWithEvidence = returnRows.map((request) => ({
    ...request,
    return_images: (request.return_images ?? []).map((image) => ({
      ...image,
      signed_url: signedByPath.get(image.storage_path) ?? null,
    })),
  }));
  return {
    zones: zones.data ?? [],
    deliverySettings: deliverySettings.data ?? [],
    paymentSettings: paymentSettings.data ?? [],
    exchangeRates: exchangeRates.data ?? [],
    payHereUsdApproved: process.env.PAYHERE_USD_APPROVED === "true",
    methods: methods.data ?? [],
    shippingAudit: shippingAudit.data ?? [],
    products: products.data ?? [],
    categories: categories.data ?? [],
    coupons: coupons.data ?? [],
    returns: returnsWithEvidence,
    refunds: refunds.data ?? [],
    deletionRequests: deletionRequests.data ?? [],
  };
}
