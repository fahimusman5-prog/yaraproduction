import type { Country } from "@/context/CountryContext";
import type { CartItem, Product } from "@/types";

export type DeliverySettingState = {
  regionCode: "LK" | "AE";
  currency: "LKR" | "AED";
  fee: number | null;
  enabled: boolean;
  configured: boolean;
};

export function isProductAvailableInRegion(
  product: Product,
  country: Country,
) {
  const regionEnabled = country === "sri-lanka"
    ? (product.shippingAvailableLKR ?? true)
    : (product.shippingAvailableAED ?? true);
  const regionalPrice =
    country === "sri-lanka" ? product.priceLKR : product.priceAED;
  const inStock =
    product.stockQuantity === undefined || product.stockQuantity > 0;
  return (
    regionEnabled &&
    inStock &&
    Number.isFinite(regionalPrice) &&
    regionalPrice >= 0
  );
}

export function getUnavailableProductIds(
  items: CartItem[],
  country: Country,
) {
  return items
    .filter(({ product }) => !isProductAvailableInRegion(product, country))
    .map(({ product }) => product.id);
}

export function calculateOrderTotal(input: {
  productSubtotal: number;
  discountTotal?: number;
  deliveryFee: number;
  paymentFee?: number;
}) {
  const productSubtotal = finiteNonNegative(
    input.productSubtotal,
    "Product subtotal",
  );
  const discountTotal = finiteNonNegative(
    input.discountTotal ?? 0,
    "Discount",
  );
  const deliveryFee = finiteNonNegative(input.deliveryFee, "Delivery fee");
  const paymentFee = finiteNonNegative(
    input.paymentFee ?? 0,
    "Payment fee",
  );
  return Math.max(0, productSubtotal - discountTotal) + deliveryFee + paymentFee;
}


export function deliveryAvailabilityLabel(
  product: Product,
  country: Country,
) {
  return isProductAvailableInRegion(product, country)
    ? "Fixed delivery fee for the entire country."
    : "Not available for delivery in this region.";
}

function finiteNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${label} must be a non-negative number.`);
  return value;
}
