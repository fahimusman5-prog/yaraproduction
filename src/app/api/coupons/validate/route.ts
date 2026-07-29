import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/log";
import { consumeRequestRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().trim().min(2).max(40),
  country: z.enum(["sri-lanka", "uae"]),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive().max(1000) })).min(1).max(100),
});

export async function POST(request: Request) {
  const rateLimit = await consumeRequestRateLimit(
    request,
    "coupon-validation",
    30,
    600,
  );
  if (!rateLimit.allowed)
    return NextResponse.json(
      {
        error:
          rateLimit.reason === "limited"
            ? "Too many coupon checks. Please wait and try again."
            : "Coupon validation is temporarily unavailable.",
      },
      { status: rateLimit.reason === "limited" ? 429 : 503 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid coupon code." }, { status: 400 });
  try {
    const supabase = getSupabaseAdminClient();
    const code = parsed.data.code.toUpperCase();
    const ids = [...new Set(parsed.data.items.map((item) => item.product_id))];
    const [couponResult, productsResult, session] = await Promise.all([
      supabase.from("coupons").select("*,coupon_products(product_id),coupon_categories(category_id)").eq("code", code).maybeSingle(),
      supabase.from("products").select("id,category_id,price_lkr,price_aed,status").in("id", ids),
      getSupabaseServerClient(),
    ]);
    const coupon = couponResult.data as any;
    if (couponResult.error || !coupon || !coupon.active) return NextResponse.json({ error: "Coupon is invalid or inactive." }, { status: 404 });
    const now = Date.now();
    if (coupon.starts_at && now < new Date(coupon.starts_at).getTime() || coupon.ends_at && now >= new Date(coupon.ends_at).getTime()) return NextResponse.json({ error: "Coupon is outside its valid dates." }, { status: 409 });
    if (![parsed.data.country, "both"].includes(coupon.country_scope)) return NextResponse.json({ error: "Coupon is not valid in this region." }, { status: 409 });
    const products = new Map((productsResult.data ?? []).map((product: any) => [product.id, product]));
    if (products.size !== ids.length || [...products.values()].some((product: any) => product.status !== "active")) return NextResponse.json({ error: "A product is unavailable." }, { status: 409 });
    const productRestrictions = new Set((coupon.coupon_products ?? []).map((item: any) => item.product_id));
    const categoryRestrictions = new Set((coupon.coupon_categories ?? []).map((item: any) => item.category_id));
    const restricted = productRestrictions.size > 0 || categoryRestrictions.size > 0;
    let subtotal = 0; let eligibleSubtotal = 0;
    for (const item of parsed.data.items) {
      const product: any = products.get(item.product_id);
      const line = Number(parsed.data.country === "sri-lanka" ? product.price_lkr : product.price_aed) * item.quantity;
      subtotal += line;
      if (!restricted || productRestrictions.has(product.id) || categoryRestrictions.has(product.category_id)) eligibleSubtotal += line;
    }
    if (subtotal < Number(coupon.minimum_order_amount)) return NextResponse.json({ error: "Order does not meet the coupon minimum." }, { status: 409 });
    if (eligibleSubtotal <= 0) return NextResponse.json({ error: "Coupon does not apply to these products." }, { status: 409 });
    const { data: claims } = session ? await session.auth.getClaims() : { data: null };
    const userId = claims?.claims?.sub;
    const usage = await supabase.from("coupon_redemptions").select("id,customer_user_id", { count: "exact" }).eq("coupon_id", coupon.id);
    if (coupon.usage_limit && (usage.count ?? 0) >= coupon.usage_limit) return NextResponse.json({ error: "Coupon usage limit has been reached." }, { status: 409 });
    if (userId && (usage.data ?? []).filter((item: any) => item.customer_user_id === userId).length >= coupon.per_customer_limit) return NextResponse.json({ error: "Coupon customer usage limit has been reached." }, { status: 409 });
    let discount = coupon.discount_type === "percentage" ? eligibleSubtotal * Number(coupon.discount_value) / 100 : Math.min(Number(coupon.discount_value), eligibleSubtotal);
    if (coupon.maximum_discount !== null) discount = Math.min(discount, Number(coupon.maximum_discount));
    discount = Math.round(Math.min(discount, subtotal) * 100) / 100;
    return NextResponse.json({ code, discount });
  } catch (error) {
    logSupabaseError("coupon-validation", "validate-coupon", error, { route: "/api/coupons/validate", table: "coupons" });
    return NextResponse.json({ error: "Coupon validation is temporarily unavailable." }, { status: 503 });
  }
}
