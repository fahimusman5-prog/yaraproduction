import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PAYMENT_COPY,
  PAYMENT_METHODS,
  type PaymentMethod,
  type PublicPaymentMethod,
} from "@/lib/payment-methods";

type SettingRow = {
  payment_method: PaymentMethod;
  processing_fee_percent: number;
  is_enabled: boolean;
  account_holder_name: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_number: string | null;
  swift_code: string | null;
  instructions: string | null;
};

export async function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country");
  if (country !== "sri-lanka" && country !== "uae")
    return NextResponse.json({ error: "Invalid country." }, { status: 400 });
  const regionCode = country === "sri-lanka" ? "LK" : "AE";
  const { data, error } = await getSupabaseAdminClient()
    .from("payment_method_settings")
    .select(
      "payment_method,processing_fee_percent,is_enabled,account_holder_name,bank_name,branch_name,account_number,swift_code,instructions",
    )
    .eq("region_code", regionCode);
  if (error)
    return NextResponse.json(
      { error: "Payment methods are temporarily unavailable." },
      { status: 503 },
    );
  const byMethod = new Map(
    ((data ?? []) as SettingRow[]).map((row) => [row.payment_method, row]),
  );
  const paymentsEnabled = process.env.PAYMENTS_ENABLED === "true";
  const methods: PublicPaymentMethod[] = PAYMENT_METHODS.map((method) => {
    const row = byMethod.get(method);
    const providerAvailable =
      method === "card"
        ? paymentsEnabled &&
          Boolean(
            process.env.PAYHERE_MERCHANT_ID?.trim() &&
              process.env.PAYHERE_MERCHANT_SECRET?.trim(),
          )
        : method === "koko"
          ? Boolean(
              process.env.KOKO_MERCHANT_ID?.trim() &&
                process.env.KOKO_MERCHANT_SECRET?.trim() &&
                process.env.KOKO_CHECKOUT_URL?.trim(),
            )
          : method === "mintpay"
            ? Boolean(
                process.env.MINTPAY_MERCHANT_ID?.trim() &&
                  process.env.MINTPAY_MERCHANT_SECRET?.trim() &&
                  process.env.MINTPAY_CHECKOUT_URL?.trim(),
              )
            : true;
    const enabled = Boolean(row?.is_enabled);
    return {
      method,
      ...PAYMENT_COPY[method],
      processingFeePercent: Number(row?.processing_fee_percent ?? 0),
      enabled,
      providerAvailable,
      unavailableReason:
        enabled && !providerAvailable
          ? `${PAYMENT_COPY[method].label} payment is being activated.`
          : !enabled
            ? `${PAYMENT_COPY[method].label} is not available for this region.`
            : undefined,
      bankDetails:
        method === "bank_transfer" && row
          ? {
              accountHolderName: row.account_holder_name ?? "",
              bankName: row.bank_name ?? "",
              branchName: row.branch_name ?? "",
              accountNumber: row.account_number ?? "",
              swiftCode: row.swift_code ?? "",
              instructions: row.instructions ?? "",
            }
          : undefined,
    };
  });
  return NextResponse.json(
    { methods },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
