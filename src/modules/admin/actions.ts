"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { toSlug } from "./lib/format";

export interface ActionState { status: "idle" | "success" | "error"; message: string }
export const initialActionState: ActionState = { status: "idle", message: "" };

function actionError(scope: string, error: unknown, fallback: string): ActionState {
  console.error(`[admin:${scope}]`, error);
  return { status: "error", message: error instanceof Error ? error.message : fallback };
}

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(180).optional(),
  description: z.string().trim().max(5000).default(""),
  category_id: z.string().uuid().or(z.literal("")).optional(),
  price_lkr: z.coerce.number().min(0).max(999999999),
  price_aed: z.coerce.number().min(0).max(999999999),
  sku: z.string().trim().min(1).max(80),
  barcode: z.string().trim().max(120).optional(),
  stock_quantity: z.coerce.number().int().min(0).max(10000000),
  low_stock_alert: z.coerce.number().int().min(0).max(1000000),
  status: z.enum(["active", "inactive", "archived"]),
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(120).optional(),
  status: z.enum(["active", "inactive"]),
});

function formObject(formData: FormData) { return Object.fromEntries(formData.entries()); }

async function actionClient() {
  return getSupabaseAdminClient();
}

async function uploadProductImage(supabase: Awaited<ReturnType<typeof actionClient>>, formData: FormData, existingUrl?: string | null) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return existingUrl ?? null;
  if (file.size > 5 * 1024 * 1024) throw new Error("Product images must be 5 MB or smaller.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPG, PNG, or WebP image.");
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `products/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

async function adjustProductStock(
  supabase: Awaited<ReturnType<typeof actionClient>>,
  productId: string,
  quantityChange: number,
  movementType: "manual_adjustment" | "restock",
  staffUserId: string,
) {
  if (quantityChange === 0) return;

  const { data: current, error: currentError } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .single();
  if (currentError || !current) throw new Error(`Stock lookup failed: ${currentError?.message ?? "Product not found"}`);

  const previousStock = Number(current.stock_quantity);
  const newStock = previousStock + quantityChange;
  if (newStock < 0) throw new Error("Stock cannot be negative.");

  const { error: updateError } = await supabase
    .from("products")
    .update({ stock_quantity: newStock })
    .eq("id", productId);
  if (updateError) throw new Error(`Stock update failed: ${updateError.message}`);

  const { error: movementError } = await supabase.from("stock_movements").insert({
    product_id: productId,
    movement_type: movementType,
    quantity_change: quantityChange,
    previous_stock: previousStock,
    new_stock: newStock,
    created_by: staffUserId,
  });
  if (movementError) throw new Error(`Stock movement failed: ${movementError.message}`);
}

export async function createProductAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin("/admin/products/new");
  const parsed = productSchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the product details." };
  try {
    const supabase = await actionClient();
    const image_url = await uploadProductImage(supabase, formData);
    const initialStock = parsed.data.stock_quantity;
    const payload = { ...parsed.data, stock_quantity: 0, slug: toSlug(parsed.data.slug || parsed.data.name), category_id: parsed.data.category_id || null, barcode: parsed.data.barcode || null, image_url };
    const { data: product, error } = await supabase.from("products").insert(payload).select("id").single(); if (error) throw new Error(`Product create failed: ${error.message}`);
    await adjustProductStock(supabase, String(product.id), initialStock, "restock", staff.userId);
  } catch (error) { return actionError("create-product", error, "Unable to create product."); }
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/pos");
  redirect("/admin/products?saved=created");
}

export async function updateProductAction(productId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin(`/admin/products/${productId}/edit`);
  if (!z.string().uuid().safeParse(productId).success) {
    return actionError("update-product", new Error(`Invalid product ID: ${productId}`), "Invalid product ID.");
  }
  const parsed = productSchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the product details." };
  try {
    const supabase = await actionClient();
    const image_url = await uploadProductImage(supabase, formData, String(formData.get("existing_image_url") || "") || null);
    const { data: current, error: currentError } = await supabase.from("products").select("stock_quantity").eq("id", productId).single(); if (currentError) throw new Error(`Product lookup failed: ${currentError.message}`);
    const { stock_quantity: targetStock, ...productFields } = parsed.data;
    const payload = { ...productFields, slug: toSlug(parsed.data.slug || parsed.data.name), category_id: parsed.data.category_id || null, barcode: parsed.data.barcode || null, image_url };
    const { error } = await supabase.from("products").update(payload).eq("id", productId); if (error) throw new Error(`Product update failed: ${error.message}`);
    const difference = targetStock - Number(current.stock_quantity);
    await adjustProductStock(supabase, productId, difference, difference > 0 ? "restock" : "manual_adjustment", staff.userId);
  } catch (error) { return actionError("update-product", error, "Unable to update product."); }
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin/inventory");
  revalidatePath("/pos");
  revalidatePath("/");
  return { status: "success", message: "Product updated successfully." };
}

export async function archiveProductAction(productId: string) {
  await requireAdmin("/admin/products");
  const supabase = await actionClient();
  const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", productId);
  if (error) { console.error("[admin:archive-product]", error); throw new Error(error.message); }
  revalidatePath("/admin/products");
}

export async function createCategoryAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin("/admin/categories");
  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the category details." };
  const supabase = await actionClient();
  const { error } = await supabase.from("categories").insert({ ...parsed.data, slug: toSlug(parsed.data.slug || parsed.data.name) });
  if (error) return actionError("create-category", error, "Unable to create category.");
  revalidatePath("/admin/categories"); return { status: "success", message: "Category created." };
}

export async function updateCategoryAction(categoryId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin("/admin/categories");
  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the category details." };
  const supabase = await actionClient();
  const { error } = await supabase.from("categories").update({ ...parsed.data, slug: toSlug(parsed.data.slug || parsed.data.name) }).eq("id", categoryId);
  if (error) return actionError("update-category", error, "Unable to update category.");
  revalidatePath("/admin/categories"); return { status: "success", message: "Category updated." };
}

export async function deleteCategoryAction(categoryId: string) {
  await requireAdmin("/admin/categories");
  const supabase = await actionClient();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) { console.error("[admin:delete-category]", error); throw new Error(error.message); }
  revalidatePath("/admin/categories"); revalidatePath("/admin/products");
}

export async function updateOrderStatusAction(orderId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff(`/admin/orders/${orderId}`);
  const parsed = z.object({ order_status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]), payment_status: z.enum(["pending", "paid", "failed", "refunded"]) }).safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: "Choose valid order and payment statuses." };
  const supabase = await actionClient();
  const { error } = await supabase.from("orders").update(parsed.data).eq("id", orderId);
  if (error) return actionError("update-order-status", error, "Unable to update order status.");
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${orderId}`); return { status: "success", message: "Order status updated." };
}

export async function adjustStockAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff("/admin/inventory");
  const parsed = z.object({ product_id: z.string().uuid(), quantity_change: z.coerce.number().int().refine((v) => v !== 0, "Enter a non-zero quantity."), movement_type: z.enum(["manual_adjustment", "restock"]) }).safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the stock adjustment." };
  try {
    await adjustProductStock(await actionClient(), parsed.data.product_id, parsed.data.quantity_change, parsed.data.movement_type, staff.userId);
  } catch (error) {
    return actionError("adjust-stock", error, "Unable to update stock.");
  }
  revalidatePath("/admin/inventory"); revalidatePath("/admin"); revalidatePath("/pos"); return { status: "success", message: "Stock updated and movement recorded." };
}
