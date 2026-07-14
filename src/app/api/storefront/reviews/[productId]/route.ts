import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/log";

const productIdSchema = z.string().uuid();

export async function GET(_: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!productIdSchema.safeParse(productId).success) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) throw new Error("Supabase storefront configuration is unavailable.");
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id,customer_name,rating,description,sort_order,product_review_images(id,storage_path,sort_order)")
      .eq("product_id", productId)
      .eq("status", "published")
      .order("sort_order")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    const reviews = (data ?? []).map((review) => {
      const row = review as { product_review_images?: Array<{ id: string; storage_path: string; sort_order: number }> } & Record<string, unknown>;
      return {
        ...row,
        product_review_images: (row.product_review_images ?? []).sort((a, b) => a.sort_order - b.sort_order).map((image) => ({
          ...image,
          image_url: supabase.storage.from("product-reviews").getPublicUrl(image.storage_path).data.publicUrl,
        })),
      };
    });
    return NextResponse.json({ reviews }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    logSupabaseError("storefront-product-reviews", "load-product-reviews", error, { route: `/api/storefront/reviews/${productId}`, table: "product_reviews", productId });
    return NextResponse.json({ error: "Reviews are temporarily unavailable." }, { status: 503 });
  }
}
