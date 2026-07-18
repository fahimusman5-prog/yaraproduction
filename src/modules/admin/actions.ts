"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import type { ActionState } from "./action-state";
import type { SkinConcern } from "@/lib/supabase/types";
import {
  buildProductPayload,
  categorySchema,
  formObject,
  productSchema,
  selectedSkinConcerns,
  skinConcernSchema,
} from "./input";
import { toSlug } from "./lib/format";

async function actionClient() {
  return getSupabaseAdminClient();
}

type ProductImageUpload = { url: string | null; newPath: string | null };

async function uploadProductImage(supabase: Awaited<ReturnType<typeof actionClient>>, formData: FormData, existingUrl?: string | null) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { url: existingUrl ?? null, newPath: null } satisfies ProductImageUpload;
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("Product images must be 5 MB or smaller.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPG, PNG, or WebP image.");
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  const path = `products/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    logSupabaseError("admin-product-image", "upload-product-image", error, { route: "/admin/products", table: "storage.objects" });
    throw error;
  }
  return { url: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl, newPath: path } satisfies ProductImageUpload;
}

function productImagePath(publicUrl: string | null | undefined) {
  if (!publicUrl) return null;
  try {
    const marker = "/storage/v1/object/public/product-images/";
    const pathname = new URL(publicUrl).pathname;
    const index = pathname.indexOf(marker);
    return index === -1 ? null : decodeURIComponent(pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

async function removeProductImage(
  supabase: Awaited<ReturnType<typeof actionClient>>,
  path: string | null,
  context: { userId: string; productId?: string },
) {
  if (!path) return;
  const { error } = await supabase.storage.from("product-images").remove([path]);
  if (error) {
    logSupabaseError("admin-product-image", "remove-product-image", error, {
      ...context,
      route: context.productId ? `/admin/products/${context.productId}/edit` : "/admin/products/new",
      table: "storage.objects",
    });
  }
}

async function saveAdminProduct(
  supabase: Awaited<ReturnType<typeof actionClient>>,
  args: {
    productId: string | null;
    actorId: string;
    product: ReturnType<typeof buildProductPayload>;
    skinConcernIds: string[];
    targetStock: number;
  },
) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: string | null; error: { code?: string; message: string; details?: string; hint?: string } | null }>;
  const { data, error } = await rpc("save_admin_product", {
    p_product_id: args.productId,
    p_actor_id: args.actorId,
    p_product: args.product,
    p_skin_concern_ids: args.skinConcernIds,
    p_target_stock: args.targetStock,
  });
  if (error) {
    throw error;
  }
  if (!data) throw new Error("The product save did not return a product ID.");
  return data;
}

async function adjustAdminProductStock(
  supabase: Awaited<ReturnType<typeof actionClient>>,
  args: { productId: string; actorId: string; quantityChange: number; movementType: "manual_adjustment" | "restock" },
) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: number | null; error: { code?: string; message: string; details?: string; hint?: string } | null }>;
  const { data, error } = await rpc("adjust_admin_product_stock", {
    p_product_id: args.productId,
    p_actor_id: args.actorId,
    p_quantity_change: args.quantityChange,
    p_movement_type: args.movementType,
  });
  if (error) throw error;
  if (data === null) throw new Error("The stock adjustment did not return a stock value.");
  return data;
}

function revalidateCatalog(productId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/inventory");
  revalidatePath("/api/storefront/catalog");
  revalidatePath("/shop");
  revalidatePath("/products");
  revalidatePath("/pos");
  revalidatePath("/sitemap.xml");
  revalidatePath("/[locale]/product/[id]", "page");
  if (productId) revalidatePath(`/admin/products/${productId}/edit`);
}

function revalidateSkinConcerns(...slugs: Array<string | null | undefined>) {
  revalidateCatalog();
  revalidatePath("/admin/skin-concerns");
  revalidatePath("/admin/products/new");
  revalidatePath("/admin/products/[id]/edit", "page");
  revalidatePath("/[locale]/skin-concerns/[slug]", "page");
  revalidatePath("/skin-concerns/[slug]", "page");
  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/skin-concerns/${slug}`);
    for (const locale of ["en", "si", "ta", "ar"]) revalidatePath(`/${locale}/skin-concerns/${slug}`);
  }
}

export type SkinConcernActionState = ActionState & { concern?: SkinConcern };

async function saveAdminSkinConcern(
  supabase: Awaited<ReturnType<typeof actionClient>>,
  args: {
    concernId: string | null;
    actorId: string;
    name: string;
    slug: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
  },
) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: string | null; error: { code?: string; message: string; details?: string; hint?: string } | null }>;
  const { data: concernId, error } = await rpc("save_admin_skin_concern", {
    p_concern_id: args.concernId,
    p_actor_id: args.actorId,
    p_name: args.name,
    p_slug: args.slug,
    p_description: args.description,
    p_sort_order: args.sortOrder,
    p_is_active: args.isActive,
  });
  if (error) throw error;
  if (!concernId) throw new Error("The skin concern save did not return an ID.");
  const result = await supabase.from("skin_concerns").select("*").eq("id", concernId).single();
  if (result.error) throw result.error;
  return result.data as unknown as SkinConcern;
}

export async function createSkinConcernAction(
  _state: SkinConcernActionState,
  formData: FormData,
): Promise<SkinConcernActionState> {
  const staff = await requireAdmin("/admin/skin-concerns");
  const parsed = skinConcernSchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the skin concern details." };
  try {
    const concern = await saveAdminSkinConcern(await actionClient(), {
      concernId: null,
      actorId: staff.userId,
      name: parsed.data.name,
      slug: toSlug(parsed.data.slug || parsed.data.name),
      description: parsed.data.description ?? "",
      sortOrder: parsed.data.sort_order,
      isActive: parsed.data.is_active === "true",
    });
    revalidateSkinConcerns(concern.slug);
    return { status: "success", message: "Skin concern created.", concern };
  } catch (error) {
    logSupabaseError("admin-skin-concerns-create", "create-skin-concern", error, {
      route: "/admin/skin-concerns",
      table: "skin_concerns",
      userId: staff.userId,
    });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to create the skin concern.", { duplicate: "A skin concern with this name or slug already exists." }) };
  }
}

export async function saveShippingZoneAction(formData: FormData) {
  const staff = await requireAdmin("/admin/shipping");
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const countryCode = String(formData.get("country_code") ?? "").trim();
  const regionName = String(formData.get("region_name") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  if (!name || !["LK", "AE"].includes(countryCode) || !Number.isInteger(sortOrder)) throw new Error("Enter a valid shipping zone.");
  const supabase = await actionClient();
  const payload = { name, country_code: countryCode, region_name: regionName, sort_order: sortOrder, active: formData.get("active") === "on", updated_at: new Date().toISOString() };
  const result = id ? await supabase.from("shipping_zones").update(payload).eq("id", id) : await supabase.from("shipping_zones").insert({ ...payload, created_at: new Date().toISOString() });
  if (result.error) throw result.error;
  revalidatePath("/admin/shipping");
  void staff;
}

export async function saveShippingMethodAction(formData: FormData) {
  const staff = await requireAdmin("/admin/shipping");
  const id = String(formData.get("id") ?? "").trim();
  const zoneId = String(formData.get("shipping_zone_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const fee = Number(formData.get("fee"));
  const currency = String(formData.get("currency") ?? "").trim();
  const minDays = Number(formData.get("estimated_min_days"));
  const maxDays = Number(formData.get("estimated_max_days"));
  const thresholdValue = String(formData.get("free_shipping_threshold") ?? "").trim();
  const threshold = thresholdValue ? Number(thresholdValue) : null;
  if (!zoneId || !name || !["LKR", "AED"].includes(currency) || !Number.isFinite(fee) || fee < 0 || !Number.isInteger(minDays) || !Number.isInteger(maxDays) || maxDays < minDays || (threshold !== null && (!Number.isFinite(threshold) || threshold < 0))) throw new Error("Enter valid shipping method details.");
  const supabase = await actionClient();
  const payload = { shipping_zone_id: zoneId, name, description: String(formData.get("description") ?? "").trim(), fee, currency, free_shipping_threshold: threshold, estimated_min_days: minDays, estimated_max_days: maxDays, sort_order: Number(formData.get("sort_order") ?? 0), active: formData.get("active") === "on", updated_at: new Date().toISOString() };
  const result = id ? await supabase.from("shipping_methods").update(payload).eq("id", id) : await supabase.from("shipping_methods").insert({ ...payload, created_at: new Date().toISOString() });
  if (result.error) throw result.error;
  revalidatePath("/admin/shipping");
  void staff;
}

export async function saveCouponAction(formData: FormData) {
  const staff = await requireAdmin("/admin/coupons");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discount_type") ?? "");
  const discountValue = Number(formData.get("discount_value"));
  const countryScope = String(formData.get("country_scope") ?? "");
  const minimumOrderAmount = Number(formData.get("minimum_order_amount") ?? 0);
  const maximumDiscountValue = String(formData.get("maximum_discount") ?? "").trim();
  const usageLimitValue = String(formData.get("usage_limit") ?? "").trim();
  const perCustomerLimit = Number(formData.get("per_customer_limit") ?? 1);
  if (!code || !["fixed", "percentage"].includes(discountType) || !["sri-lanka", "uae", "both"].includes(countryScope) || !Number.isFinite(discountValue) || discountValue <= 0 || discountType === "percentage" && discountValue > 100 || !Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0 || (maximumDiscountValue && Number(maximumDiscountValue) < 0) || (usageLimitValue && (!Number.isInteger(Number(usageLimitValue)) || Number(usageLimitValue) <= 0)) || !Number.isInteger(perCustomerLimit) || perCustomerLimit <= 0) throw new Error("Enter valid coupon details.");
  const supabase = await actionClient();
  const result = await supabase.from("coupons").insert({ code, discount_type: discountType, discount_value: discountValue, country_scope: countryScope, starts_at: formData.get("starts_at") ? new Date(String(formData.get("starts_at"))).toISOString() : null, ends_at: formData.get("ends_at") ? new Date(String(formData.get("ends_at"))).toISOString() : null, minimum_order_amount: minimumOrderAmount, maximum_discount: maximumDiscountValue ? Number(maximumDiscountValue) : null, usage_limit: usageLimitValue ? Number(usageLimitValue) : null, per_customer_limit: perCustomerLimit, active: formData.get("active") === "on", created_by: staff.userId });
  if (result.error) throw result.error;
  revalidatePath("/admin/coupons");
}

export async function updateSkinConcernAction(
  concernId: string,
  _state: SkinConcernActionState,
  formData: FormData,
): Promise<SkinConcernActionState> {
  const staff = await requireAdmin("/admin/skin-concerns");
  if (!z.string().uuid().safeParse(concernId).success) return { status: "error", message: "Skin concern not found." };
  const parsed = skinConcernSchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the skin concern details." };
  const supabase = await actionClient();
  const before = await supabase.from("skin_concerns").select("slug").eq("id", concernId).maybeSingle();
  if (before.error) return { status: "error", message: messageFromSupabaseError(before.error, "Unable to load the skin concern before saving.") };
  if (!before.data) return { status: "error", message: "Skin concern not found." };
  try {
    const concern = await saveAdminSkinConcern(supabase, {
      concernId,
      actorId: staff.userId,
      name: parsed.data.name,
      slug: toSlug(parsed.data.slug || parsed.data.name),
      description: parsed.data.description ?? "",
      sortOrder: parsed.data.sort_order,
      isActive: parsed.data.is_active === "true",
    });
    revalidateSkinConcerns(String(before.data.slug), concern.slug);
    return { status: "success", message: "Skin concern updated.", concern };
  } catch (error) {
    logSupabaseError("admin-skin-concerns-update", "update-skin-concern", error, {
      route: "/admin/skin-concerns",
      table: "skin_concerns",
      userId: staff.userId,
      skinConcernId: concernId,
    });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to update the skin concern.", { duplicate: "A skin concern with this name or slug already exists.", notFound: "Skin concern not found." }) };
  }
}

export async function setSkinConcernActiveAction(concernId: string, isActive: boolean) {
  const staff = await requireAdmin("/admin/skin-concerns");
  if (!z.string().uuid().safeParse(concernId).success) throw new Error("Skin concern not found.");
  const supabase = await actionClient();
  const current = await supabase.from("skin_concerns").select("*").eq("id", concernId).maybeSingle();
  if (current.error) throw new Error(messageFromSupabaseError(current.error, "Unable to load the skin concern."));
  if (!current.data) throw new Error("Skin concern not found.");
  const row = current.data as Record<string, unknown>;
  try {
    const concern = await saveAdminSkinConcern(supabase, {
      concernId,
      actorId: staff.userId,
      name: String(row.name),
      slug: String(row.slug),
      description: typeof row.description === "string" ? row.description : "",
      sortOrder: Number(row.sort_order ?? 0),
      isActive,
    });
    revalidateSkinConcerns(concern.slug);
  } catch (error) {
    logSupabaseError("admin-skin-concerns-status", "set-skin-concern-status", error, {
      route: "/admin/skin-concerns",
      table: "skin_concerns",
      userId: staff.userId,
      skinConcernId: concernId,
    });
    throw new Error(messageFromSupabaseError(error, "Unable to update the skin concern status."));
  }
}

export async function deleteSkinConcernAction(concernId: string) {
  const staff = await requireAdmin("/admin/skin-concerns");
  if (!z.string().uuid().safeParse(concernId).success) throw new Error("Skin concern not found.");
  const supabase = await actionClient();
  const current = await supabase.from("skin_concerns").select("slug").eq("id", concernId).maybeSingle();
  if (current.error) throw new Error(messageFromSupabaseError(current.error, "Unable to load the skin concern."));
  if (!current.data) throw new Error("Skin concern not found.");
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { code?: string; message: string; details?: string; hint?: string } | null }>;
  const { error } = await rpc("delete_admin_skin_concern", { p_concern_id: concernId, p_actor_id: staff.userId });
  if (error) {
    logSupabaseError("admin-skin-concerns-delete", "delete-skin-concern", error, {
      route: "/admin/skin-concerns",
      table: "skin_concerns",
      userId: staff.userId,
      skinConcernId: concernId,
    });
    throw new Error(messageFromSupabaseError(error, "Unable to delete the skin concern.", { invalidReference: "Assigned skin concerns must be deactivated instead of deleted.", notFound: "Skin concern not found." }));
  }
  revalidateSkinConcerns(String(current.data.slug));
}

export async function createProductAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin("/admin/products/new");
  const parsed = productSchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the product details." };
  const supabase = await actionClient();
  let upload: ProductImageUpload = { url: null, newPath: null };
  try {
    upload = await uploadProductImage(supabase, formData);
    await saveAdminProduct(supabase, {
      productId: null,
      actorId: staff.userId,
      product: buildProductPayload(parsed.data, upload.url),
      skinConcernIds: selectedSkinConcerns(formData),
      targetStock: parsed.data.stock_quantity,
    });
  } catch (error) {
    await removeProductImage(supabase, upload.newPath, { userId: staff.userId });
    logSupabaseError("admin-products-create", "create-product-action", error, {
      route: "/admin/products/new",
      table: "products",
      userId: staff.userId,
    });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to create product.") };
  }
  revalidateCatalog();
  redirect("/admin/products?saved=created");
}

export async function updateProductAction(productId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin(`/admin/products/${productId}/edit`);
  if (!z.string().uuid().safeParse(productId).success) return { status: "error", message: "Product not found." };
  const parsed = productSchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the product details." };
  const supabase = await actionClient();
  const currentResult = await supabase.from("products").select("image_url").eq("id", productId).maybeSingle();
  if (currentResult.error) {
    logSupabaseError("admin-products-edit", "select-current-product", currentResult.error, {
      route: `/admin/products/${productId}/edit`,
      table: "products",
      userId: staff.userId,
      productId,
    });
    return { status: "error", message: messageFromSupabaseError(currentResult.error, "Unable to load the product before saving.") };
  }
  if (!currentResult.data) return { status: "error", message: "Product not found." };

  const previousImageUrl = typeof currentResult.data.image_url === "string" ? currentResult.data.image_url : null;
  let upload: ProductImageUpload = { url: previousImageUrl, newPath: null };
  try {
    upload = await uploadProductImage(supabase, formData, previousImageUrl);
    await saveAdminProduct(supabase, {
      productId,
      actorId: staff.userId,
      product: buildProductPayload(parsed.data, upload.url),
      skinConcernIds: selectedSkinConcerns(formData),
      targetStock: parsed.data.stock_quantity,
    });
  } catch (error) {
    await removeProductImage(supabase, upload.newPath, { userId: staff.userId, productId });
    logSupabaseError("admin-products-edit", "update-product-action", error, {
      route: `/admin/products/${productId}/edit`,
      table: "products",
      userId: staff.userId,
      productId,
    });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to update product.") };
  }
  if (upload.newPath) {
    await removeProductImage(supabase, productImagePath(previousImageUrl), { userId: staff.userId, productId });
  }
  revalidateCatalog(productId);
  redirect("/admin/products?saved=updated");
}

export async function archiveProductAction(productId: string) {
  const staff = await requireAdmin("/admin/products");
  if (!z.string().uuid().safeParse(productId).success) throw new Error("Product not found.");
  const supabase = await actionClient();
  const { data, error } = await supabase.from("products").update({ status: "archived" }).eq("id", productId).select("id").maybeSingle();
  if (error) {
    logSupabaseError("admin-products-archive", "archive-product", error, {
      route: "/admin/products",
      table: "products",
      userId: staff.userId,
      productId,
    });
    throw new Error(messageFromSupabaseError(error, "Unable to archive the product."));
  }
  if (!data) throw new Error("Product not found.");
  revalidateCatalog(productId);
}

export async function createCategoryAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin("/admin/categories");
  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the category details." };
  const supabase = await actionClient();
  const { error } = await supabase.from("categories").insert({ ...parsed.data, slug: toSlug(parsed.data.slug || parsed.data.name) });
  if (error) {
    logSupabaseError("admin-category-create", "insert-category", error, {
      route: "/admin/categories",
      table: "categories",
      userId: staff.userId,
    });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to create the category.") };
  }
  revalidateCatalog();
  return { status: "success", message: "Category created." };
}

export async function updateCategoryAction(categoryId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin("/admin/categories");
  if (!z.string().uuid().safeParse(categoryId).success) return { status: "error", message: "Category not found." };
  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the category details." };
  const supabase = await actionClient();
  const { data, error } = await supabase.from("categories").update({ ...parsed.data, slug: toSlug(parsed.data.slug || parsed.data.name) }).eq("id", categoryId).select("id").maybeSingle();
  if (error) {
    logSupabaseError("admin-category-update", "update-category", error, {
      route: "/admin/categories",
      table: "categories",
      userId: staff.userId,
      categoryId,
    });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to update the category.") };
  }
  if (!data) return { status: "error", message: "Category not found." };
  revalidateCatalog();
  return { status: "success", message: "Category updated." };
}

export async function deleteCategoryAction(categoryId: string) {
  const staff = await requireAdmin("/admin/categories");
  if (!z.string().uuid().safeParse(categoryId).success) throw new Error("Category not found.");
  const supabase = await actionClient();
  const assigned = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", categoryId);
  if (assigned.error) {
    logSupabaseError("admin-category-delete", "check-category-products", assigned.error, {
      route: "/admin/categories",
      table: "products",
      userId: staff.userId,
      categoryId,
    });
    throw new Error(messageFromSupabaseError(assigned.error, "Unable to verify whether the category is in use."));
  }
  if ((assigned.count ?? 0) > 0) throw new Error("This category is assigned to products and cannot be deleted.");

  const { data, error } = await supabase.from("categories").delete().eq("id", categoryId).select("id").maybeSingle();
  if (error) {
    logSupabaseError("admin-category-delete", "delete-category", error, {
      route: "/admin/categories",
      table: "categories",
      userId: staff.userId,
      categoryId,
    });
    throw new Error(messageFromSupabaseError(error, "Unable to delete the category."));
  }
  if (!data) throw new Error("Category not found.");
  revalidateCatalog();
}

export async function updateOrderStatusAction(orderId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff(`/admin/orders/${orderId}`);
  const parsed = z.object({ order_status: z.enum(["pending", "paid", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"]), payment_status: z.enum(["pending", "paid", "failed", "refunded"]), note: z.string().trim().max(1000).default("") }).safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: "Choose valid order and payment statuses." };
  const supabase = await actionClient();
  const rpc = supabase.rpc.bind(supabase) as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>;
  const { data, error } = await rpc("update_admin_order_status", { p_order_id: orderId, p_order_status: parsed.data.order_status, p_payment_status: parsed.data.payment_status, p_actor_id: staff.userId, p_note: parsed.data.note });
  if (error) {
    logSupabaseError("admin-order-status-update", "update-order-status", error, {
      route: `/admin/orders/${orderId}`,
      table: "orders",
      userId: staff.userId,
      orderId,
    });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to update the order status.") };
  }
  if (!data) return { status: "error", message: "Order not found." };
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${orderId}`); return { status: "success", message: "Order status updated." };
}

export async function adjustStockAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff("/admin/inventory");
  const parsed = z.object({ product_id: z.string().uuid(), quantity_change: z.coerce.number().int().refine((v) => v !== 0, "Enter a non-zero quantity."), movement_type: z.enum(["manual_adjustment", "restock"]) }).safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the stock adjustment." };
  try {
    await adjustAdminProductStock(await actionClient(), {
      productId: parsed.data.product_id,
      actorId: staff.userId,
      quantityChange: parsed.data.quantity_change,
      movementType: parsed.data.movement_type,
    });
  } catch (error) {
    logSupabaseError("admin-inventory-update", "adjust-stock-action", error, {
      route: "/admin/inventory",
      table: "stock_movements",
      userId: staff.userId,
      productId: parsed.data.product_id,
    });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to update stock.") };
  }
  revalidateCatalog(parsed.data.product_id);
  return { status: "success", message: "Stock updated and movement recorded." };
}
