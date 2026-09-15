export type ShippingLabelPaymentState =
  | { type: "cod"; heading: "CASH ON DELIVERY"; instruction: string; amount: number; currency: string }
  | { type: "prepaid"; heading: "PREPAID"; instruction: "NO PAYMENT TO COLLECT" }
  | { type: "pending"; heading: "PAYMENT PENDING"; instruction: string }
  | { type: "cancelled"; heading: "CANCELLED ORDER"; instruction: "DO NOT DISPATCH" }
  | { type: "refunded"; heading: "REFUNDED"; instruction: "DO NOT COLLECT PAYMENT" }
  | { type: "other"; heading: "PAYMENT REVIEW"; instruction: string };

export interface ShippingLabelItem {
  name: string;
  sku: string;
  quantity: number;
}

export interface ShippingLabelData {
  orderNumber: string;
  orderDate?: string;
  region: string;
  currency: string;
  customerName: string;
  phone: string;
  email?: string;
  addressLines: string[];
  country: string;
  payment: ShippingLabelPaymentState;
  items: ShippingLabelItem[];
  subtotal: number;
  discount: number;
  delivery: number;
  processingFee: number;
  grandTotal: number;
  courier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  orderStatus: string;
}
