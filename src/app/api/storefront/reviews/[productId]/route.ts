import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/log";

const productIdSchema = z.string().uuid();
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  description: z.string().trim().min(10).max(800),
});

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

export async function POST(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!productIdSchema.safeParse(productId).success) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "JSON request required." }, { status: 415 });
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your review." }, { status: 400 });
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Reviews are temporarily unavailable." }, { status: 503 });
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (!userId) return NextResponse.json({ error: "Sign in to submit a review." }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    const customerName = String(profile?.full_name ?? claims.claims.email ?? "YARA customer").trim().slice(0, 100);
    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      customer_user_id: userId,
      customer_name: customerName,
      rating: parsed.data.rating,
      description: parsed.data.description,
      status: "hidden",
    });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "You have already submitted a review for this product." }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ message: "Thank you. Your review was submitted for moderation." }, { status: 201 });
  } catch (error) {
    logSupabaseError("storefront-product-reviews", "submit-review", error, { route: `/api/storefront/reviews/${productId}`, table: "product_reviews", productId });
    return NextResponse.json({ error: "We could not submit your review. Please try again." }, { status: 500 });
  }
}
