import type { Country } from "@/context/CountryContext";
import type { CartItem, Product } from "@/types";

export type ShippingCalculation = "per_line" | "per_unit";

export type ProductShippingQuote =
  | { available: true; configured: true; free: boolean; fee: number; calculation: ShippingCalculation }
  | { available: true; configured: false; free: false; fee: null; calculation: ShippingCalculation }
  | { available: false; configured: true; free: false; fee: null; calculation: ShippingCalculation };

export function getProductShipping(product: Product, country: Country): ProductShippingQuote {
  const isSriLanka = country === "sri-lanka";
  const available = (isSriLanka ? product.shippingAvailableLKR : product.shippingAvailableAED) ?? true;
  const free = (isSriLanka ? product.freeShippingLKR : product.freeShippingAED) ?? false;
  const configuredFee = (isSriLanka ? product.shippingLKR : product.shippingAED) ?? null;
  const calculation = (isSriLanka ? product.shippingCalculationLKR : product.shippingCalculationAED) ?? "per_line";
  if (!available) return { available: false, configured: true, free: false, fee: null, calculation };
  if (free) return { available: true, configured: true, free: true, fee: 0, calculation };
  if (configuredFee === null || !Number.isFinite(configuredFee) || configuredFee < 0) {
    return { available: true, configured: false, free: false, fee: null, calculation };
  }
  return { available: true, configured: true, free: false, fee: configuredFee, calculation };
}

export function calculateCartShipping(items: CartItem[], country: Country) {
  const lines = items.map(({ product, quantity }) => {
    const quote = getProductShipping(product, country);
    const fee = quote.available && quote.configured
      ? (quote.fee ?? 0) * (quote.calculation === "per_unit" ? quantity : 1)
      : null;
    return { productId: product.id, quantity, quote, fee };
  });
  const unavailable = lines.filter((line) => !line.quote.available).map((line) => line.productId);
  const unconfigured = lines.filter((line) => line.quote.available && !line.quote.configured).map((line) => line.productId);
  return {
    lines,
    unavailable,
    unconfigured,
    valid: unavailable.length === 0 && unconfigured.length === 0,
    total: lines.reduce((sum, line) => sum + (line.fee ?? 0), 0),
  };
}

export function shippingLabel(product: Product, country: Country, format: (amount: number) => string) {
  const quote = getProductShipping(product, country);
  if (!quote.available) return "Not available in your region";
  if (!quote.configured) return "Delivery rate unavailable";
  if (quote.free) return "Free Delivery";
  return `Delivery: ${format(quote.fee ?? 0)}`;
}
