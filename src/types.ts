export type Category = string;

export interface Product {
  id: string;
  slug?: string;
  name: string;
  subtitle: string;
  priceLKR: number;
  priceAED: number;
  category: Category;
  concern: string;
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
  stockQuantity?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
