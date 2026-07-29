import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";
import { consumeRequestRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rateLimit = await consumeRequestRateLimit(
    request,
    "shipping-settings",
    120,
    600,
  );
  if (!rateLimit.allowed)
    return NextResponse.json(
      { error: "Delivery settings are temporarily unavailable." },
      { status: rateLimit.reason === "limited" ? 429 : 503 },
    );
  const country = new URL(request.url).searchParams.get("country");
  const parsed = z.enum(["sri-lanka", "uae"]).safeParse(country);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose a valid region." },
      { status: 400 },
    );

  const regionCode = parsed.data === "sri-lanka" ? "LK" : "AE";
  const expectedCurrency = parsed.data === "sri-lanka" ? "LKR" : "AED";
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from("delivery_settings")
      .select("currency,delivery_fee,is_enabled,is_configured")
      .eq("region_code", regionCode)
      .maybeSingle();
    if (error) throw error;

    const fee =
      data?.delivery_fee === null || data?.delivery_fee === undefined
        ? null
        : Number(data.delivery_fee);
    const valid =
      data?.is_configured === true &&
      data?.is_enabled === true &&
      data.currency === expectedCurrency &&
      fee !== null &&
      Number.isFinite(fee) &&
      fee >= 0;

    return NextResponse.json(
      {
        deliveryConfigured: data?.is_configured === true,
        deliveryEnabled: data?.is_enabled === true,
        deliveryFee: valid ? fee : null,
        currency: data?.currency ?? expectedCurrency,
        feeChargedOnce: true,
        message: valid
          ? "Fixed delivery fee for the entire country."
          : "Delivery is temporarily unavailable for this country.",
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
