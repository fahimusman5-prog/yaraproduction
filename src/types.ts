export type Category = "Skincare" | "Haircare" | "Body Care" | "Gift Sets";

export interface Product {
  id: string;
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
}

export interface CartItem {
  product: Product;
  quantity: number;
}
