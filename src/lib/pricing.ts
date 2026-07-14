export interface PricePair {
  sellingPrice: number;
  originalPrice: number | null;
}

export function getDisplayPricePair(
  sellingPrice: number,
  originalPrice: number | null,
  quantity = 1,
): PricePair {
  const visibleOriginalPrice =
    originalPrice !== null && originalPrice > sellingPrice
      ? originalPrice * quantity
      : null;

  return {
    sellingPrice: sellingPrice * quantity,
    originalPrice: visibleOriginalPrice,
  };
}

export function optionalPriceFromForm(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? null : value;
}
