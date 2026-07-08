import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    const [{ data: products, error: productsError }, { data: categories, error: categoriesError }, { data: skinConcerns, error: concernsError }] = await Promise.all([
      supabase.from("products").select("id,name,slug,description,image_url,price_lkr,price_aed,stock_quantity,benefits,how_to_use,ingredients,caution,seo_title,seo_description,original_category,featured,categories(name),product_skin_concerns(skin_concerns(name,slug))").eq("status", "active").order("name"),
      supabase.from("categories").select("id,name,slug").eq("status", "active").order("name"),
      supabase.from("skin_concerns").select("id,name,slug").eq("status", "active").order("name"),
    ]);
    if (productsError || categoriesError || concernsError) throw productsError || categoriesError || concernsError;
    return NextResponse.json({ products, categories, skinConcerns }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Catalog load failed", error);
    return NextResponse.json({ error: "Catalog is temporarily unavailable." }, { status: 503 });
  }
}
