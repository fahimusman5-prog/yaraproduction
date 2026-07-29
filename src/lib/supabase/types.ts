export type StaffRole = "admin" | "staff";
export type ProfileRole = StaffRole | "customer";
export type RecordStatus = "active" | "inactive";
export type ProductStatus = RecordStatus | "archived";
export type OrderStatus = "pending" | "paid" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "cod" | "online";
export type ReviewStatus = "published" | "hidden";
export type NewsletterSubscriberStatus = "subscribed" | "unsubscribed";

export interface ProductReviewImage {
  id: string;
  review_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
  image_url?: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  description: string;
  status: ReviewStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_review_images?: ProductReviewImage[];
  products?: Pick<Product, "name" | "slug"> | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: ProfileRole;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  normalized_email: string;
  status: NewsletterSubscriberStatus;
  source: string;
  locale: string | null;
  country: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  status: RecordStatus;
  created_at: string;
  updated_at?: string;
  product_count?: number;
}

export interface SkinConcern {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  image_url: string | null;
  price_lkr: number;
  price_aed: number;
  original_price_lkr: number | null;
  original_price_aed: number | null;
  sku: string;
  barcode: string | null;
  stock_quantity: number;
  low_stock_alert: number;
  status: ProductStatus;
  benefits: string[];
  how_to_use: string;
  ingredients: string;
  caution: string;
  original_category: string;
  image_status: string;
  pdf_source_page: string;
  seo_title: string;
  seo_description: string;
  featured: boolean;
  shipping_fee_lkr: number | null;
  shipping_fee_aed: number | null;
  free_shipping_lkr: boolean;
  free_shipping_aed: boolean;
  shipping_available_lkr: boolean;
  shipping_available_aed: boolean;
  shipping_calculation_lkr: "per_line" | "per_unit";
  shipping_calculation_aed: "per_line" | "per_unit";
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, "name"> | null;
  product_skin_concerns?: Array<{ skin_concerns: Pick<SkinConcern, "id" | "name" | "slug"> | null }> | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  country: "sri-lanka" | "uae";
  currency: "LKR" | "AED";
  total_amount: number;
  payment_method: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  order_status: OrderStatus;
  created_at: string;
  subtotal_amount: number;
  shipping_fee: number;
  payment_fee: number;
  discount_amount: number;
  region_code: "LK" | "AE";
  shipping_method_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  courier_name: string | null;
  tracking_number: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  shipping_fee: number;
  shipping_calculation_type: "per_line" | "per_unit";
  free_shipping: boolean;
  product_shipping_fee: number;
  products?: Pick<Product, "name" | "sku"> | null;
}

export interface PosSale {
  id: string;
  sale_number: string;
  cashier_id: string;
  payment_method: "cash" | "card" | "bank_transfer";
  subtotal: number;
  discount: number;
  total_amount: number;
  currency: "LKR" | "AED";
  created_at: string;
  profiles?: Pick<Profile, "full_name"> | null;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: "online_order" | "pos_sale" | "manual_adjustment" | "restock";
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
  products?: Pick<Product, "name" | "sku"> | null;
  profiles?: Pick<Profile, "full_name"> | null;
}
