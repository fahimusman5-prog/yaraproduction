export type Category = string;

export interface Product {
  id: string;
  slug?: string;
  name: string;
  subtitle: string;
  priceLKR: number;
  priceAED: number;
  originalPriceLKR: number | null;
  originalPriceAED: number | null;
  category: Category;
  concern: string;
  concerns?: string[];
  concernSlugs?: string[];
  image: string;
  gallery?: string[];
  badge?: string;
  size: string;
  rating: number;
  reviews: number;
  description: string;
  benefits: string[];
  howToUse: string;
  ingredients: string;
  caution?: string;
  seoTitle?: string;
  seoDescription?: string;
  stockQuantity?: number;
  shippingLKR?: number | null;
  shippingAED?: number | null;
  freeShippingLKR?: boolean;
  freeShippingAED?: boolean;
  shippingAvailableLKR?: boolean;
  shippingAvailableAED?: boolean;
  shippingCalculationLKR?: "per_line" | "per_unit";
  shippingCalculationAED?: "per_line" | "per_unit";
}

export interface CartItem {
  product: Product;
  quantity: number;
}
