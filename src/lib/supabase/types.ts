export type StaffRole = "admin" | "staff";
export type ProfileRole = StaffRole | "customer";
export type RecordStatus = "active" | "inactive";
export type ProductStatus = RecordStatus | "archived";
export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "cod" | "online";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: ProfileRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  status: RecordStatus;
  created_at: string;
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
  sku: string;
  barcode: string | null;
  stock_quantity: number;
  low_stock_alert: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, "name"> | null;
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
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
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
