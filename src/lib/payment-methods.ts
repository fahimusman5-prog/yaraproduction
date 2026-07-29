export const PAYMENT_METHODS = [
  "card",
  "koko",
  "mintpay",
  "bank_transfer",
  "cash_on_delivery",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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

export const PAYMENT_COPY: Record<
  PaymentMethod,
  { label: string; description: string; action: string }
> = {
  card: {
    label: "Card Payment",
    description: "Secure online payment",
    action: "Pay Now",
  },
  koko: {
    label: "Koko",
    description: "Pay in instalments with Koko",
    action: "Pay with Koko",
  },
  mintpay: {
    label: "MintPay",
    description: "Pay in instalments with MintPay",
    action: "Pay with MintPay",
  },
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
  return Math.round(basePayable * (percentage / 100) * 100) / 100;
}

