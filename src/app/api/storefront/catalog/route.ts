import { NextResponse } from "next/server";
import { logSupabaseError } from "@/lib/supabase/log";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function isMissingCatalogRelation(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST200" ||
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("product_skin_concerns") ||
    error.message?.includes("skin_concerns")
  );
}

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    const productsResult = await supabase.from("products").select("id,name,slug,description,image_url,price_lkr,price_aed,stock_quantity,benefits,how_to_use,ingredients,caution,seo_title,seo_description,original_category,featured,categories(name),product_skin_concerns(skin_concerns(name,slug))").eq("status", "active").order("name");
    const productsFallback = productsResult.error && isMissingCatalogRelation(productsResult.error)
      ? await supabase.from("products").select("id,name,slug,description,image_url,price_lkr,price_aed,stock_quantity,benefits,how_to_use,ingredients,caution,seo_title,seo_description,original_category,featured,categories(name)").eq("status", "active").order("name")
      : null;
    if (productsResult.error && productsFallback) logSupabaseError("storefront-catalog", "optional-select-product-skin-concerns", productsResult.error);
    const [{ data: categories, error: categoriesError }, { data: skinConcerns, error: concernsError }] = await Promise.all([
      supabase.from("categories").select("id,name,slug").eq("status", "active").order("name"),
      supabase.from("skin_concerns").select("id,name,slug").eq("status", "active").order("name"),
    ]);
    const products = productsFallback?.data ?? productsResult.data;
    const productsError = productsFallback?.error ?? productsResult.error;
    const safeConcerns = concernsError && isMissingCatalogRelation(concernsError) ? [] : skinConcerns;
    if (concernsError && isMissingCatalogRelation(concernsError)) logSupabaseError("storefront-catalog", "optional-select-skin-concerns", concernsError);
    if (productsError || categoriesError || (concernsError && !isMissingCatalogRelation(concernsError))) {
      const error = productsError || categoriesError || concernsError;
      logSupabaseError("storefront-catalog", "load-catalog", error);
      throw error;
    }
    return NextResponse.json({ products, categories, skinConcerns: safeConcerns }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    logSupabaseError("storefront-catalog", "catalog-route", error);
    return NextResponse.json({ error: "Catalog is temporarily unavailable." }, { status: 503 });
  }
}
