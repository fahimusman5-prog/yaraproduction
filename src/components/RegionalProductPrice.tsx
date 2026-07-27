import type { Country } from "../context/CountryContext";
import { formatPrice, getProductOriginalPrice, getProductPrice } from "../lib/format";
import type { Product } from "../types";
import { PriceDisplay } from "./PriceDisplay";

interface RegionalProductPriceProps {
  product: Product;
  country: Country | null;
  quantity?: number;
  className?: string;
  sellingClassName?: string;
  originalClassName?: string;
}

export function RegionalProductPrice({
  product,
  country,
  quantity,
  className,
  sellingClassName,
  originalClassName,
}: RegionalProductPriceProps) {
  if (!country) return null;

  return (
    <PriceDisplay
      sellingPrice={getProductPrice(product, country)}
      originalPrice={getProductOriginalPrice(product, country)}
      format={(price) => formatPrice(price, country)}
      quantity={quantity}
      className={className}
      sellingClassName={sellingClassName}
      originalClassName={originalClassName}
    />
  );
}
