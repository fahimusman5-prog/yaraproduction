import { getSupabaseServerClient } from "./supabase/server";

export type PublicProduct = {
  id: string; name: string; slug: string; description: string; image_url: string | null; sku: string | null;
  price_lkr: number; price_aed: number; stock_quantity: number; updated_at: string | null;
  benefits: string[] | null; how_to_use: string | null; ingredients: string | null; caution: string | null;
  seo_title: string | null; seo_description: string | null; categories: { name: string } | null;
};

export async function getActiveProductBySlug(slug: string): Promise<PublicProduct | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("products").select("id,name,slug,description,image_url,sku,price_lkr,price_aed,stock_quantity,updated_at,benefits,how_to_use,ingredients,caution,seo_title,seo_description,categories(name)").eq("slug", slug).eq("status", "active").maybeSingle();
  if (error) return null;
  return (data as PublicProduct | null) ?? null;
}
