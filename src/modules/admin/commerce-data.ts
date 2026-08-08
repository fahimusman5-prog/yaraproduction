import "server-only";
import { requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPayHereConfig } from "@/lib/payhere";
import { getAppUrlIssues } from "@/lib/supabase/env";
import { logSupabaseError } from "@/lib/supabase/log";
import { activeRateReasonMessage, resolveActiveAedLkrRate } from "@/lib/exchange-rates";
import { unstable_noStore as noStore } from "next/cache";

export async function getCommerceOperations() {
  noStore();
  const staff = await requireStaff("/admin/commerce");
  const supabase = getSupabaseAdminClient();
  const requestId = crypto.randomUUID();
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
            .from("payment_method_settings")
            .select("*")
            .eq("payment_method", "bank_transfer")
            .order("region_code")
        : Promise.resolve({ data: [], error: null }),
      staff.profile.role === "admin"
        ? supabase
            .from("exchange_rates")
            .select("*")
            .eq("source_currency", "AED")
            .eq("target_currency", "LKR")
            .order("effective_from", { ascending: false })
            .order("created_at", { ascending: false })
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
  if (failure?.error) {
    const failedIndex = [
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
    ].findIndex((result) => result === failure);
    const operations = [
      "zones",
      "delivery-settings",
      "bank-transfer-settings",
      "aed-lkr-exchange-rates",
      "payment-methods",
      "shipping-audit-history",
      "products",
      "categories",
      "coupons",
      "returns",
      "refunds",
      "account-deletion-requests",
    ];
    logSupabaseError("admin-commerce", `load-${operations[failedIndex] ?? "unknown"}`, failure.error, {
      route: "/admin/commerce",
      table: operations[failedIndex],
      requestId,
      userId: staff.userId,
    });
    throw new Error(
      "Commerce operations could not be loaded. Apply the latest migrations.",
    );
  }
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
  if (signedEvidence.error) {
    logSupabaseError("admin-commerce", "sign-return-evidence", signedEvidence.error, {
      route: "/admin/commerce",
      table: "storage.objects",
      requestId,
      userId: staff.userId,
    });
    throw new Error("Private return evidence could not be authorized.");
  }
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
  const cardSettings = staff.profile.role === "admin"
    ? await supabase
        .from("payment_method_settings")
        .select("region_code,is_enabled,payment_method,provider_name")
        .eq("payment_method", "card")
        .in("region_code", ["LK", "AE"])
    : { data: [], error: null };
  if (cardSettings.error) {
    logSupabaseError("admin-commerce", "load-card-settings", cardSettings.error, {
      route: "/admin/commerce",
      table: "payment_method_settings",
      requestId,
      userId: staff.userId,
    });
    throw new Error("PayHere configuration could not be loaded.");
  }
  const payHere = getPayHereConfig();
  const rateResolution = await resolveActiveAedLkrRate(supabase);
  const activeUaeRate = rateResolution.rate !== null;
  const rateRows = (exchangeRates.data ?? []) as Array<Record<string, unknown>>;
  const updaterIds = [...new Set(rateRows.map((row) => String(row.updated_by ?? "")).filter(Boolean))];
  const updaterResult = updaterIds.length
    ? await supabase.from("profiles").select("id,full_name,email").in("id", updaterIds)
    : { data: [], error: null };
  const updaterRows = (updaterResult.data ?? []) as Array<{ id: string; full_name?: string | null; email?: string | null }>;
  const updaterById = new Map(updaterRows.map((row) => [String(row.id), row]));
  const exchangeRatesWithUpdater = rateRows.map((row) => ({
    ...row,
    updated_by_name: updaterById.get(String(row.updated_by))?.full_name ?? null,
    updated_by_email: updaterById.get(String(row.updated_by))?.email ?? null,
  }));
  const activeAedLkrRate = rateResolution.rate
    ? { ...rateResolution.rate, ...exchangeRatesWithUpdater.find((row) => String((row as { id?: unknown }).id) === rateResolution.rate?.id) }
    : null;
  const cardByRegion = Object.fromEntries(
    (cardSettings.data ?? []).map((row) => [String((row as { region_code: string }).region_code), Boolean((row as { is_enabled: boolean }).is_enabled)]),
  ) as Record<string, boolean>;
  const commonReady = payHere.enabled && payHere.merchantIdConfigured && payHere.merchantSecretConfigured && getAppUrlIssues().length === 0;
  const reasons = [
    !payHere.enabled ? "PAYHERE_ENABLED is false or missing." : null,
    !payHere.merchantIdConfigured ? "PAYHERE_MERCHANT_ID is missing." : null,
    !payHere.merchantSecretConfigured ? "PAYHERE_MERCHANT_SECRET is missing." : null,
    getAppUrlIssues().length > 0 ? getAppUrlIssues()[0] : null,
    !cardByRegion.LK ? "Sri Lanka card payment is disabled in payment_method_settings." : null,
    !cardByRegion.AE ? "UAE card payment is disabled in payment_method_settings." : null,
    !activeUaeRate ? activeRateReasonMessage(rateResolution.reason) : null,
  ].filter((reason): reason is string => Boolean(reason));
  return {
    zones: zones.data ?? [],
    deliverySettings: deliverySettings.data ?? [],
    paymentSettings: paymentSettings.data ?? [],
    exchangeRates: exchangeRatesWithUpdater,
    activeAedLkrRate,
    methods: methods.data ?? [],
    shippingAudit: shippingAudit.data ?? [],
    products: products.data ?? [],
    categories: categories.data ?? [],
    coupons: coupons.data ?? [],
    returns: returnsWithEvidence,
    refunds: refunds.data ?? [],
    deletionRequests: deletionRequests.data ?? [],
    payHereDiagnostic: {
      enabled: payHere.enabled,
      sandbox: payHere.sandbox,
      merchantIdConfigured: payHere.merchantIdConfigured,
      merchantSecretConfigured: payHere.merchantSecretConfigured,
      siteUrlValid: getAppUrlIssues().length === 0,
      cardByRegion,
      activeUaeRate,
      rateReason: rateResolution.reason,
      activeAedLkrRate,
      availableByRegion: {
        LK: commonReady && Boolean(cardByRegion.LK),
        AE: commonReady && Boolean(cardByRegion.AE) && activeUaeRate,
      },
      reasons,
    },
  };
}
