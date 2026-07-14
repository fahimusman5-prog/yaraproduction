import { NextResponse } from "next/server";
import { logSupabaseError } from "@/lib/supabase/log";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    const [productsResult, categoriesResult, concernsResult] = await Promise.all([
      supabase
        .from("products")
        .select("id,name,slug,description,image_url,price_lkr,price_aed,original_price_lkr,original_price_aed,stock_quantity,benefits,how_to_use,ingredients,caution,seo_title,seo_description,original_category,featured,categories(name),product_skin_concerns(skin_concerns(name,slug))")
        .eq("status", "active")
        .order("name"),
      supabase.from("categories").select("id,name,slug").eq("status", "active").order("name"),
      supabase.from("skin_concerns").select("id,name,slug").eq("status", "active").order("name"),
    ]);

    const failures = [
      { result: productsResult, table: "products" },
      { result: categoriesResult, table: "categories" },
      { result: concernsResult, table: "skin_concerns" },
    ].filter((entry) => entry.result.error);
    if (failures.length) {
      for (const failure of failures) {
        logSupabaseError("storefront-catalog", "load-catalog", failure.result.error, {
          route: "/api/storefront/catalog",
          table: failure.table,
        });
      }
      return NextResponse.json({ error: "Catalog is temporarily unavailable." }, { status: 503 });
    }

    return NextResponse.json(
      {
        products: productsResult.data ?? [],
        categories: categoriesResult.data ?? [],
        skinConcerns: concernsResult.data ?? [],
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    logSupabaseError("storefront-catalog", "catalog-route", error, { route: "/api/storefront/catalog" });
    return NextResponse.json({ error: "Catalog is temporarily unavailable." }, { status: 503 });
  }
}
