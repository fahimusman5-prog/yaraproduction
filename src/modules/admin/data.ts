import "server-only";
import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/auth";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import type {
  Category,
  Order,
  OrderItem,
  PosSale,
  Product,
  Profile,
  SkinConcern,
  StockMovement,
  ProductReview,
} from "@/lib/supabase/types";

export async function getReviews() {
  noStore();
  const supabase = await client("/admin/reviews");
  const { data, error } = await supabase.from("product_reviews").select("*,products(name,slug),product_review_images(id,storage_path,sort_order)").order("created_at", { ascending: false }).limit(500);
  if (error) failLoad("admin-reviews-list", "select-reviews", error, { route: "/admin/reviews", table: "product_reviews", fallback: "Unable to load reviews.", schemaUnavailable: "The product review tables are unavailable. Apply the latest database migration." });
  return (data ?? []) as ProductReview[];
}

export async function getReview(reviewId: string) {
  noStore();
  const supabase = await client(`/admin/reviews/${reviewId}/edit`);
  const { data, error } = await supabase.from("product_reviews").select("*,products(name,slug),product_review_images(id,review_id,storage_path,sort_order,created_at)").eq("id", reviewId).maybeSingle();
  if (error) failLoad("admin-reviews-edit", "select-review", error, { route: `/admin/reviews/${reviewId}/edit`, table: "product_reviews", fallback: "Unable to load review.", schemaUnavailable: "The product review tables are unavailable. Apply the latest database migration." });
  if (!data) return null;
  const review = data as ProductReview;
  return { ...review, product_review_images: review.product_review_images?.map((image) => ({ ...image, image_url: supabase.storage.from("product-reviews").getPublicUrl(image.storage_path).data.publicUrl })) };
}

type LoadFailureOptions = {
  route: string;
  table: string;
  fallback: string;
  schemaUnavailable?: string;
};

function failLoad(area: string, action: string, error: unknown, options: LoadFailureOptions): never {
  logSupabaseError(area, action, error, {
    route: options.route,
    table: options.table,
  });
  throw new Error(messageFromSupabaseError(error, options.fallback, {
    schemaUnavailable: options.schemaUnavailable,
  }));
}

async function client(nextPath: string) {
  await requireStaff(nextPath);
  return getSupabaseAdminClient();
}

export async function getCategories() {
  const supabase = await client("/admin/categories");
  const { data, error } = await supabase
    .from("categories")
    .select("*,products(count)")
    .order("name");
  if (error) {
    logSupabaseError("admin-categories-list", "select-categories", error, {
      route: "/admin/categories",
      table: "categories",
    });
    throw new Error(messageFromSupabaseError(error, "Unable to load categories.", {
      schemaUnavailable: "The categories table or its product relationship is unavailable.",
    }));
  }
  return (data ?? []).map((row) => {
    const category = row as Record<string, unknown> & { products?: Array<{ count?: number }> };
    const { products, ...fields } = category;
    return { ...fields, product_count: Number(products?.[0]?.count ?? 0) } as unknown as Category;
  });
}
export async function getSkinConcerns(nextPath = "/admin/products/new") {
  const supabase = await client(nextPath);
  const { data, error } = await supabase
    .from("skin_concerns")
    .select("*,product_skin_concerns(count)")
    .order("sort_order")
    .order("name");
  if (error) {
    logSupabaseError("admin-skin-concerns-list", "select-skin-concerns", error, {
      route: nextPath,
      table: "skin_concerns",
    });
    throw new Error(messageFromSupabaseError(error, "Unable to load skin concerns.", {
      schemaUnavailable: "The skin concerns table is unavailable.",
    }));
  }
  return (data ?? []).map((row) => {
    const concern = row as Record<string, unknown> & { product_skin_concerns?: Array<{ count?: number }> };
    const { product_skin_concerns, ...fields } = concern;
    return { ...fields, product_count: Number(product_skin_concerns?.[0]?.count ?? 0) } as unknown as SkinConcern;
  });
}
export async function getProducts() {
  const supabase = await client("/admin/products");
  const { data, error } = await supabase
    .from("products")
    .select("*,categories(name),product_skin_concerns(skin_concerns(id,name,slug))")
    .order("created_at", { ascending: false });
  if (error) {
    logSupabaseError("admin-products-list", "select-products", error, {
      route: "/admin/products",
      table: "products",
    });
    throw new Error(messageFromSupabaseError(error, "Unable to load products.", {
      schemaUnavailable: "The products table or one of its catalog relationships is unavailable.",
    }));
  }
  return (data ?? []) as Product[];
}
export async function getProduct(productId: string) {
  const supabase = await client(`/admin/products/${productId}/edit`);
  const { data, error } = await supabase
    .from("products")
    .select("*,categories(name),product_skin_concerns(skin_concerns(id,name,slug))")
    .eq("id", productId)
    .maybeSingle();
  if (error) {
    logSupabaseError("admin-products-edit", "select-product", error, {
      route: `/admin/products/${productId}/edit`,
      table: "products",
      productId,
    });
    throw new Error(messageFromSupabaseError(error, "Unable to load the product.", {
      schemaUnavailable: "The products table or one of its catalog relationships is unavailable.",
    }));
  }
  return data ? (data as Product) : null;
}
export async function getOrders() {
  const supabase = await client("/admin/orders");
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    failLoad("admin-orders-list", "select-orders", error, {
      route: "/admin/orders",
      table: "orders",
      fallback: "Unable to load orders.",
      schemaUnavailable: "The orders table is unavailable.",
    });
  }
  return (data ?? []) as Order[];
}
export async function getOrder(orderId: string) {
  const supabase = await client(`/admin/orders/${orderId}`);
  const [orderResult, itemsResult] = await Promise.all([
    supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
    supabase
      .from("order_items")
      .select("*,products(name,sku)")
      .eq("order_id", orderId),
  ]);
  if (orderResult.error) {
    failLoad("admin-orders-detail", "select-order", orderResult.error, {
      route: `/admin/orders/${orderId}`,
      table: "orders",
      fallback: "Unable to load the order.",
      schemaUnavailable: "The orders table is unavailable.",
    });
  }
  if (itemsResult.error) {
    failLoad("admin-orders-detail", "select-order-items", itemsResult.error, {
      route: `/admin/orders/${orderId}`,
      table: "order_items",
      fallback: "Unable to load the order items.",
      schemaUnavailable: "The order item relationship is unavailable.",
    });
  }
  if (!orderResult.data) return null;
  return {
    order: orderResult.data as Order,
    items: (itemsResult.data ?? []) as OrderItem[],
  };
}
export async function getCustomers() {
  const supabase = await client("/admin/customers");
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
  if (profiles.error) {
    failLoad("admin-customers-list", "select-profiles", profiles.error, {
      route: "/admin/customers",
      table: "profiles",
      fallback: "Unable to load customer profiles.",
      schemaUnavailable: "The customer profile table is unavailable.",
    });
  }
  if (orders.error) {
    failLoad("admin-customers-list", "select-orders", orders.error, {
      route: "/admin/customers",
      table: "orders",
      fallback: "Unable to load customer orders.",
      schemaUnavailable: "The orders table is unavailable.",
    });
  }
  return {
    profiles: (profiles.data ?? []) as Profile[],
    orders: (orders.data ?? []) as Order[],
  };
}
export async function getInventory() {
  const supabase = await client("/admin/inventory");
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
  if (products.error) {
    failLoad("admin-inventory-list", "select-products", products.error, {
      route: "/admin/inventory",
      table: "products",
      fallback: "Unable to load inventory products.",
      schemaUnavailable: "The product inventory data is unavailable.",
    });
  }
  if (movements.error) {
    failLoad("admin-inventory-list", "select-stock-movements", movements.error, {
      route: "/admin/inventory",
      table: "stock_movements",
      fallback: "Unable to load stock movements.",
      schemaUnavailable: "The stock movement data is unavailable.",
    });
  }
  return {
    products: (products.data ?? []) as Product[],
    movements: (movements.data ?? []) as StockMovement[],
  };
}
export async function getDashboardData() {
  const supabase = await client("/admin");
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
  if (orders.error) {
    failLoad("admin-dashboard", "select-orders", orders.error, {
      route: "/admin",
      table: "orders",
      fallback: "Unable to load dashboard orders.",
    });
  }
  if (sales.error) {
    failLoad("admin-dashboard", "select-pos-sales", sales.error, {
      route: "/admin",
      table: "pos_sales",
      fallback: "Unable to load dashboard sales.",
    });
  }
  if (products.error) {
    failLoad("admin-dashboard", "select-products", products.error, {
      route: "/admin",
      table: "products",
      fallback: "Unable to load dashboard products.",
    });
  }
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
  const supabase = await client("/admin/reports");
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
  if (orders.error) {
    failLoad("admin-reports", "select-orders", orders.error, {
      route: "/admin/reports",
      table: "orders",
      fallback: "Unable to load report orders.",
    });
  }
  if (sales.error) {
    failLoad("admin-reports", "select-pos-sales", sales.error, {
      route: "/admin/reports",
      table: "pos_sales",
      fallback: "Unable to load report sales.",
    });
  }
  if (saleItems.error) {
    failLoad("admin-reports", "select-pos-sale-items", saleItems.error, {
      route: "/admin/reports",
      table: "pos_sale_items",
      fallback: "Unable to load report sale items.",
    });
  }
  if (orderItems.error) {
    failLoad("admin-reports", "select-order-items", orderItems.error, {
      route: "/admin/reports",
      table: "order_items",
      fallback: "Unable to load report order items.",
    });
  }
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
