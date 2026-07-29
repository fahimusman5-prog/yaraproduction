import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";
import { consumeRequestRateLimit } from "@/lib/rate-limit";

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

export async function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country");
  const parsed = z.enum(["sri-lanka", "uae"]).safeParse(country);
  if (!parsed.success)
    return NextResponse.json({ error: "Choose a valid region." }, { status: 400 });
  const regionCode = parsed.data === "sri-lanka" ? "LK" : "AE";
  const currency = parsed.data === "sri-lanka" ? "LKR" : "AED";
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from("delivery_settings")
      .select("currency,delivery_fee,is_enabled,is_configured")
      .eq("region_code", regionCode)
      .maybeSingle();
    if (error)
      return NextResponse.json(
        { error: "Delivery settings are temporarily unavailable." },
        { status: 503 },
      );
    const configuredFee =
      data?.delivery_fee === null || data?.delivery_fee === undefined
        ? null
        : Number(data.delivery_fee);
    return NextResponse.json(
      {
        deliveryConfigured: data?.is_configured === true,
        deliveryEnabled: data?.is_enabled === true,
        deliveryFee:
          data?.is_configured === true &&
          data?.is_enabled === true &&
          configuredFee !== null &&
          Number.isFinite(configuredFee) &&
          configuredFee >= 0
            ? configuredFee
            : null,
        currency: data?.currency ?? currency,
        feeChargedOnce: true,
        message:
          data?.is_configured === true && data?.is_enabled === true
            ? "Delivery is charged once per order."
            : parsed.data === "uae"
              ? "Delivery fee will be confirmed."
              : "Delivery is temporarily unavailable.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logSupabaseError("shipping-options", "load-regional-setting", error, {
      route: "/api/shipping/options",
      table: "delivery_settings",
    });
    return NextResponse.json(
      { error: "Delivery settings are temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    return NextResponse.json({ error: "JSON request required." }, { status: 415 });
  const rateLimit = await consumeRequestRateLimit(
    request,
    "shipping-options",
    60,
    600,
  );
  if (!rateLimit.allowed)
    return NextResponse.json(
      {
        error:
          rateLimit.reason === "limited"
            ? "Too many delivery checks. Please wait and try again."
            : "Delivery options are temporarily unavailable.",
      },
      { status: rateLimit.reason === "limited" ? 429 : 503 },
    );
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
      data: {
        options?: unknown[];
        reason?: string | null;
        deliveryConfigured?: boolean;
        deliveryEnabled?: boolean;
        deliveryFee?: number | null;
        currency?: "LKR" | "AED";
        feeChargedOnce?: boolean;
      } | null;
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
      deliveryConfigured: data?.deliveryConfigured === true,
      deliveryEnabled: data?.deliveryEnabled === true,
      deliveryFee:
        typeof data?.deliveryFee === "number" ? data.deliveryFee : null,
      currency: data?.currency ?? null,
      feeChargedOnce: data?.feeChargedOnce === true,
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
