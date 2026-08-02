export const PAYMENT_METHODS = [
  "card",
  "koko",
  "bank_transfer",
  "cash_on_delivery",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { type: "online" | "offline"; processingFeePercent: number }
> = {
  card: { type: "online", processingFeePercent: 4 },
  koko: { type: "online", processingFeePercent: 9 },
  mintpay: { type: "online", processingFeePercent: 4 },
  bank_transfer: { type: "offline", processingFeePercent: 0 },
  cash_on_delivery: { type: "offline", processingFeePercent: 0 },
};

export type PublicPaymentMethod = {
  method: PaymentMethod;
  label: string;
  description: string;
  processingFeePercent: number;
  enabled: boolean;
  providerAvailable: boolean;
  unavailableReason?: string;
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    swiftCode: string;
    instructions: string;
  };
};

export function hasUsableBankTransferDetails(details: {
  accountHolderName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
}) {
  const holder = details.accountHolderName?.trim() ?? "";
  const bank = details.bankName?.trim() ?? "";
  const account = details.accountNumber?.trim() ?? "";
  const placeholderPattern =
    /\b(?:check|test|example|placeholder|dummy|sample|n\/?a|your account(?: number)?)\b/i;
  return (
    holder.length >= 2 &&
    bank.length >= 2 &&
    account.length >= 5 &&
    !placeholderPattern.test(holder) &&
    !placeholderPattern.test(bank) &&
    !placeholderPattern.test(account) &&
    !/^0+$/.test(account.replace(/\s+/g, ""))
  );
}

export const PAYMENT_COPY: Record<
  PaymentMethod,
  { label: string; description: string; action: string }
> = {
  card: {
    label: "Card Payment",
    description: "Secure online payment",
    action: "Proceed to Payment",
  },
  koko: {
    label: "Koko",
    description: "Pay in instalments with Koko",
    action: "Proceed to Payment",
  },
<<<<<<< Updated upstream
  mintpay: {
    label: "MintPay",
    description: "Pay in instalments with MintPay",
    action: "Proceed to Payment",
  },
=======
>>>>>>> Stashed changes
  bank_transfer: {
    label: "Bank Transfer",
    description: "Transfer directly to our bank account",
    action: "Confirm Bank Transfer Order",
  },
  cash_on_delivery: {
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    action: "Confirm Cash on Delivery Order",
  },
};

export function calculateProcessingFee(
  productSubtotal: number,
  discountTotal: number,
  deliveryFee: number,
  percentage: number,
  currency: "LKR" | "AED" = "AED",
) {
  for (const value of [
    productSubtotal,
    discountTotal,
    deliveryFee,
    percentage,
  ])
    if (!Number.isFinite(value) || value < 0)
      throw new Error("Payment calculation values must be non-negative.");
  const basePayable =
    Math.max(0, productSubtotal - discountTotal) + deliveryFee;
  const fee = basePayable * (percentage / 100);
  return currency === "LKR"
    ? Math.round(fee)
    : Math.round(fee * 100) / 100;
}
