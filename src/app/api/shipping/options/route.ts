import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";

const schema = z.object({
  country: z.enum(["sri-lanka", "uae"]),
  city: z.string().trim().min(2).max(160),
  subtotal: z.number().min(0).max(999_999_999),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive().max(1_000),
      }),
    )
    .min(1)
    .max(100),
});

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    return NextResponse.json({ error: "JSON request required." }, { status: 415 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the delivery address." },
      { status: 400 },
    );
  try {
    const supabase = getSupabaseAdminClient();
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{
      data: { options?: unknown[]; reason?: string | null } | null;
      error: { message?: string } | null;
    }>;
    const { data, error } = await rpc("get_configured_shipping_options", {
      p_country: parsed.data.country,
      p_city: parsed.data.city,
      p_subtotal: parsed.data.subtotal,
      p_items: parsed.data.items,
    });
    if (error) {
      logSupabaseError("shipping-options", "calculate", error, {
        route: "/api/shipping/options",
      });
      return NextResponse.json(
        { error: "Delivery options are temporarily unavailable." },
        { status: 503 },
      );
    }
    return NextResponse.json({
      options: Array.isArray(data?.options) ? data.options : [],
      reason: data?.reason ?? null,
    });
  } catch (error) {
    logSupabaseError("shipping-options", "load", error, {
      route: "/api/shipping/options",
    });
    return NextResponse.json(
      { error: "Delivery options are temporarily unavailable." },
      { status: 500 },
    );
  }
}
