import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PAYMENT_COPY,
  PAYMENT_METHOD_CONFIG,
  hasUsableBankTransferDetails,
  PAYMENT_METHODS,
  type PaymentMethod,
  type PublicPaymentMethod,
} from "@/lib/payment-methods";

type SettingRow = {
  payment_method: PaymentMethod;
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
      "payment_method,account_holder_name,bank_name,branch_name,account_number,swift_code,instructions",
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
        ? country === "sri-lanka" &&
          paymentsEnabled &&
          Boolean(
            process.env.PAYHERE_MERCHANT_ID?.trim() &&
              process.env.PAYHERE_MERCHANT_SECRET?.trim(),
          )
        : method === "koko"
          ? false
          : method === "mintpay"
            ? false
            : method === "bank_transfer"
              ? hasUsableBankTransferDetails({
                  accountHolderName: row?.account_holder_name,
                  bankName: row?.bank_name,
                  accountNumber: row?.account_number,
                })
              : true;
    const enabled = providerAvailable;
    return {
      method,
      ...PAYMENT_COPY[method],
      processingFeePercent:
        PAYMENT_METHOD_CONFIG[method].processingFeePercent,
      enabled,
      providerAvailable,
      unavailableReason:
        !providerAvailable
          ? "Temporarily unavailable"
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
