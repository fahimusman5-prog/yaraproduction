import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({ country: z.enum(["sri-lanka", "uae"]) });

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid country." }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const countryCode = parsed.data.country === "sri-lanka" ? "LK" : "AE";
  const { data, error } = await supabase
    .from("shipping_methods")
    .select("id,name,description,fee,currency,free_shipping_threshold,estimated_min_days,estimated_max_days,shipping_zones!inner(country_code,name,region_name)")
    .eq("active", true)
    .eq("shipping_zones.active", true)
    .eq("shipping_zones.country_code", countryCode)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: "Shipping options are temporarily unavailable." }, { status: 503 });
  return NextResponse.json({ methods: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
