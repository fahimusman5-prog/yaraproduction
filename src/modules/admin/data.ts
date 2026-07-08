import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Category,
  Order,
  OrderItem,
  PosSale,
  Product,
  Profile,
  SkinConcern,
  StockMovement,
} from "@/lib/supabase/types";

async function client() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function getCategories() {
  const supabase = await client();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}
export async function getSkinConcerns() {
  const supabase = await client();
  const { data, error } = await supabase
    .from("skin_concerns")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as SkinConcern[];
}
export async function getProducts() {
  const supabase = await client();
  const { data, error } = await supabase
    .from("products")
    .select("*,categories(name),product_skin_concerns(skin_concerns(id,name,slug))")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}
export async function getProduct(productId: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("products")
    .select("*,categories(name),product_skin_concerns(skin_concerns(id,name,slug))")
    .eq("id", productId)
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}
export async function getOrders() {
  const supabase = await client();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}
export async function getOrder(orderId: string) {
  const supabase = await client();
  const [orderResult, itemsResult] = await Promise.all([
    supabase.from("orders").select("*").eq("id", orderId).single(),
    supabase
      .from("order_items")
      .select("*,products(name,sku)")
      .eq("order_id", orderId),
  ]);
  if (orderResult.error) throw new Error(orderResult.error.message);
  if (itemsResult.error) throw new Error(itemsResult.error.message);
  return {
    order: orderResult.data as Order,
    items: (itemsResult.data ?? []) as OrderItem[],
  };
}
export async function getCustomers() {
  const supabase = await client();
  const [profiles, orders] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "customer")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  if (orders.error) throw new Error(orders.error.message);
  return {
    profiles: (profiles.data ?? []) as Profile[],
    orders: (orders.data ?? []) as Order[],
  };
}
export async function getInventory() {
  const supabase = await client();
  const [products, movements] = await Promise.all([
    supabase
      .from("products")
      .select("*,categories(name)")
      .neq("status", "archived")
      .order("stock_quantity"),
    supabase
      .from("stock_movements")
      .select("*,products(name,sku),profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (products.error) throw new Error(products.error.message);
  if (movements.error) throw new Error(movements.error.message);
  return {
    products: (products.data ?? []) as Product[],
    movements: (movements.data ?? []) as StockMovement[],
  };
}
export async function getDashboardData() {
  const supabase = await client();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const todayIso = new Date(
    `${get("year")}-${get("month")}-${get("day")}T00:00:00+05:30`,
  ).toISOString();
  const [orders, sales, products] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("pos_sales")
      .select("*,profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("products")
      .select("*,categories(name)")
      .neq("status", "archived"),
  ]);
  if (orders.error) throw new Error(orders.error.message);
  if (sales.error) throw new Error(sales.error.message);
  if (products.error) throw new Error(products.error.message);
  const orderRows = (orders.data ?? []) as Order[];
  const saleRows = (sales.data ?? []) as PosSale[];
  const productRows = (products.data ?? []) as Product[];
  const todayOrders = orderRows.filter(
    (o) =>
      o.created_at >= todayIso &&
      o.payment_status === "paid" &&
      o.order_status !== "cancelled",
  );
  const todaySales = saleRows.filter((s) => s.created_at >= todayIso);
  const paidOrders = orderRows.filter(
    (o) => o.payment_status === "paid" && o.order_status !== "cancelled",
  );
  const sumOrders = (rows: Order[], currency: "LKR" | "AED") =>
    rows
      .filter((o) => o.currency === currency)
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
  return {
    orders: orderRows,
    sales: saleRows,
    products: productRows,
    recentOrders: orderRows.slice(0, 6),
    lowStock: productRows.filter((p) => p.stock_quantity <= p.low_stock_alert),
    todayLkr:
      sumOrders(todayOrders, "LKR") +
      todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0),
    todayAed: sumOrders(todayOrders, "AED"),
    totalLkr:
      sumOrders(paidOrders, "LKR") +
      saleRows.reduce((sum, s) => sum + Number(s.total_amount), 0),
    totalAed: sumOrders(paidOrders, "AED"),
    posToday: todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0),
  };
}
export async function getReportsData() {
  const supabase = await client();
  const [orders, sales, saleItems, orderItems] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("payment_status", "paid")
      .neq("order_status", "cancelled")
      .order("created_at"),
    supabase.from("pos_sales").select("*").order("created_at"),
    supabase
      .from("pos_sale_items")
      .select("quantity,subtotal,products(name,sku)"),
    supabase
      .from("order_items")
      .select(
        "quantity,subtotal,products(name,sku),orders!inner(payment_status,order_status)",
      )
      .eq("orders.payment_status", "paid")
      .neq("orders.order_status", "cancelled"),
  ]);
  if (orders.error) throw new Error(orders.error.message);
  if (sales.error) throw new Error(sales.error.message);
  if (saleItems.error) throw new Error(saleItems.error.message);
  if (orderItems.error) throw new Error(orderItems.error.message);
  type SalesItem = {
    quantity: number;
    subtotal: number;
    products: { name: string; sku: string } | null;
  };
  return {
    orders: (orders.data ?? []) as Order[],
    sales: (sales.data ?? []) as PosSale[],
    saleItems: (saleItems.data ?? []) as unknown as SalesItem[],
    orderItems: (orderItems.data ?? []) as unknown as SalesItem[],
  };
}
