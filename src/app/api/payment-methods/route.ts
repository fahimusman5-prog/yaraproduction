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
import { getPayHereConfig } from "@/lib/payhere";
import { resolveActiveAedLkrRate } from "@/lib/exchange-rates";

type SettingRow = {
  payment_method: PaymentMethod;
  provider_name: string | null;
  is_enabled: boolean;
  account_holder_name: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_number: string | null;
  iban: string | null;
  swift_code: string | null;
  instructions: string | null;
};

export async function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country");
  if (country !== "sri-lanka" && country !== "uae")
    return NextResponse.json({ error: "Invalid country." }, { status: 400 });
  const regionCode = country === "sri-lanka" ? "LK" : "AE";
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("payment_method_settings")
    .select(
      "payment_method,provider_name,is_enabled,account_holder_name,bank_name,branch_name,account_number,iban,swift_code,instructions",
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
  const payHere = getPayHereConfig();
  const rateResolution = country === "uae"
    ? await resolveActiveAedLkrRate(admin)
    : null;
  const uaeLkrReady = rateResolution?.rate !== null;
  const methods: PublicPaymentMethod[] = PAYMENT_METHODS.map((method) => {
    const row = byMethod.get(method);
    const providerAvailable =
      method === "card"
        ? Boolean(row?.is_enabled) &&
          row?.provider_name === "payhere" &&
          payHere.enabled &&
          payHere.merchantIdConfigured &&
          payHere.merchantSecretConfigured &&
          (country === "sri-lanka"
            ? true
            : uaeLkrReady)
        : method === "koko"
          ? false
          : method === "bank_transfer"
            ? Boolean(row?.is_enabled) &&
              hasUsableBankTransferDetails({
                accountHolderName: row?.account_holder_name,
                bankName: row?.bank_name,
                accountNumber: row?.account_number,
                iban: row?.iban,
                swiftCode: row?.swift_code,
                country,
              })
            : Boolean(row?.is_enabled);
    const enabled = providerAvailable;
    return {
      method,
      ...PAYMENT_COPY[method],
      processingFeePercent:
        PAYMENT_METHOD_CONFIG[method].processingFeePercent,
      enabled,
      providerAvailable,
      bankDetails:
        method === "bank_transfer" && row
          ? {
              accountHolderName: row.account_holder_name ?? "",
              bankName: row.bank_name ?? "",
              branchName: row.branch_name ?? "",
              accountNumber: row.account_number ?? "",
              iban: row.iban ?? "",
              swiftCode: row.swift_code ?? "",
              instructions: row.instructions ?? "",
            }
          : undefined,
    };
  }).filter((method) => method.enabled && method.providerAvailable);
  return NextResponse.json(
    { methods },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
