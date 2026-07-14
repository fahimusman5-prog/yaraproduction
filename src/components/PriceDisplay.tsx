import { getDisplayPricePair } from "../lib/pricing";

interface PriceDisplayProps {
  sellingPrice: number;
  originalPrice: number | null;
  format: (price: number) => string;
  quantity?: number;
  className?: string;
  sellingClassName?: string;
  originalClassName?: string;
}

export function PriceDisplay({
  sellingPrice,
  originalPrice,
  format,
  quantity = 1,
  className = "flex flex-col",
  sellingClassName = "font-serif font-semibold text-yara-wine",
  originalClassName = "text-sm text-yara-taupe",
}: PriceDisplayProps) {
  const prices = getDisplayPricePair(sellingPrice, originalPrice, quantity);
  const formattedSellingPrice = format(prices.sellingPrice);

  return (
    <span className={className}>
      <span className={sellingClassName} aria-label={`Current price ${formattedSellingPrice}`}>
        {formattedSellingPrice}
      </span>
      {prices.originalPrice !== null && (
        <del
          className={originalClassName}
          aria-label={`Original price ${format(prices.originalPrice)}`}
        >
          {format(prices.originalPrice)}
        </del>
      )}
    </span>
  );
}
