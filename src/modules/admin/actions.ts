"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import { PRODUCT_IMAGE_BUCKET, type ProductImageAssets } from "@/lib/product-images";
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
import {
  sendOrderTransactionalEmail,
  type EmailTemplate,
} from "@/lib/email";

async function actionClient() {
  return getSupabaseAdminClient();
}

type ProductImageUpload = ProductImageAssets | { url: string | null; cardUrl: string | null; thumbnailUrl: string | null; originalUrl: string | null; paths: string[]; originalBytes: number; optimizedBytes: number; width: number; height: number; outputWidth: number; outputHeight: number; durationMs: number };

async function uploadProductImage(
  supabase: Awaited<ReturnType<typeof actionClient>>,
  formData: FormData,
  existing?: { url: string | null; cardUrl: string | null; thumbnailUrl: string | null; originalUrl: string | null },
  productKey = "pending",
) {
  // Keep the native image processor out of unrelated admin routes such as
  // order details. Vercel must load its Linux optional binary only when an
  // image upload action actually runs.
  const { optimizeProductImage } = await import("@/lib/product-images");
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return {
      ...(existing ?? { url: null, cardUrl: null, thumbnailUrl: null, originalUrl: null }),
      paths: [], originalBytes: 0, optimizedBytes: 0, width: 0, height: 0, outputWidth: 0, outputHeight: 0, durationMs: 0,
    } satisfies ProductImageUpload;
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("Product images must be 5 MB or smaller.");
  const optimized = await optimizeProductImage(file, `products/${productKey}`);
  const uploads = [
    [optimized.originalPath, optimized.input, file.type],
    [optimized.detailPath, optimized.detail, "image/webp"],
    [optimized.cardPath, optimized.card, "image/webp"],
    [optimized.thumbnailPath, optimized.thumbnail, "image/webp"],
  ] as const;
  const uploadedPaths: string[] = [];
  for (const [path, body, contentType] of uploads) {
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, body, {
      contentType, upsert: false, cacheControl: "31536000",
    });
    if (error) {
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([...uploadedPaths, path]);
      logSupabaseError("admin-product-image", "upload-product-image", error, {
      route: "/admin/products",
      table: "storage.objects",
      });
      throw new Error("The image was not uploaded. The original product image is still safe.");
    }
    uploadedPaths.push(path);
  }
  const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);
  const publicUrl = (path: string) => bucket.getPublicUrl(path).data.publicUrl;
  console.info("[product-image] optimized", { originalBytes: optimized.originalBytes, optimizedBytes: optimized.optimizedBytes, width: optimized.width, height: optimized.height, outputWidth: optimized.outputWidth, outputHeight: optimized.outputHeight, durationMs: optimized.durationMs });
  return {
    url: publicUrl(optimized.detailPath), cardUrl: publicUrl(optimized.cardPath), thumbnailUrl: publicUrl(optimized.thumbnailPath), originalUrl: publicUrl(optimized.originalPath), paths: uploadedPaths,
    originalBytes: optimized.originalBytes, optimizedBytes: optimized.optimizedBytes, width: optimized.width, height: optimized.height, outputWidth: optimized.outputWidth, outputHeight: optimized.outputHeight, durationMs: optimized.durationMs,
  } satisfies ProductImageUpload;
}

function productImagePath(publicUrl: string | null | undefined) {
  if (!publicUrl) return null;
  try {
    const marker = "/storage/v1/object/public/product-images/";
    const pathname = new URL(publicUrl).pathname;
    const index = pathname.indexOf(marker);
    return index === -1
      ? null
      : decodeURIComponent(pathname.slice(index + marker.length));
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
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  if (error) {
    logSupabaseError("admin-product-image", "remove-product-image", error, {
      ...context,
      route: context.productId
        ? `/admin/products/${context.productId}/edit`
        : "/admin/products/new",
      table: "storage.objects",
    });
  }
}

async function removeProductImages(
  supabase: Awaited<ReturnType<typeof actionClient>>,
  paths: string[],
  context: { userId: string; productId?: string },
) {
  for (const path of paths) await removeProductImage(supabase, path, context);
}

async function saveAdminProduct(
  supabase: Awaited<ReturnType<typeof actionClient>>,
  args: {
    productId: string | null;
    actorId: string;
    product: ReturnType<typeof buildProductPayload>;
    skinConcernIds: string[];
    targetStock: number;
    imageVariants: { cardUrl: string | null; thumbnailUrl: string | null; originalUrl: string | null };
  },
) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data: string | null;
    error: {
      code?: string;
      message: string;
      details?: string;
      hint?: string;
    } | null;
  }>;
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
  const variantUpdate = await supabase.from("products").update({
    image_card_url: args.imageVariants.cardUrl,
    image_thumbnail_url: args.imageVariants.thumbnailUrl,
    original_image_url: args.imageVariants.originalUrl,
  }).eq("id", data);
  if (variantUpdate.error) {
    // The RPC has already persisted image_url, so leaving the new immutable
    // objects in place keeps the storefront valid and makes this retryable.
    logSupabaseError("admin-product-image", "persist-image-variants", variantUpdate.error, { table: "products", productId: data });
  }
  return data;
}

async function adjustAdminProductStock(
  supabase: Awaited<ReturnType<typeof actionClient>>,
  args: {
    productId: string;
    actorId: string;
    quantityChange: number;
    movementType: "manual_adjustment" | "restock";
  },
) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data: number | null;
    error: {
      code?: string;
      message: string;
      details?: string;
      hint?: string;
    } | null;
  }>;
  const { data, error } = await rpc("adjust_admin_product_stock", {
    p_product_id: args.productId,
    p_actor_id: args.actorId,
    p_quantity_change: args.quantityChange,
    p_movement_type: args.movementType,
  });
  if (error) throw error;
  if (data === null)
    throw new Error("The stock adjustment did not return a stock value.");
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
  for (const slug of new Set(
    slugs.filter((value): value is string => Boolean(value)),
  )) {
    revalidatePath(`/skin-concerns/${slug}`);
    for (const locale of ["en", "si", "ta", "ar"])
      revalidatePath(`/${locale}/skin-concerns/${slug}`);
  }
}

export type SkinConcernActionState = ActionState & { concern?: SkinConcern };

export async function setNewsletterSubscriberStatusAction(
  subscriberId: string,
  status: "subscribed" | "unsubscribed",
) {
  const staff = await requireAdmin("/admin/newsletter");
  if (
    !z.string().uuid().safeParse(subscriberId).success ||
    !z.enum(["subscribed", "unsubscribed"]).safeParse(status).success
  )
    return;
  const updates =
    status === "subscribed"
      ? {
          status,
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        }
      : { status, unsubscribed_at: new Date().toISOString() };
  const { error } = await getSupabaseAdminClient()
    .from("newsletter_subscribers")
    .update(updates)
    .eq("id", subscriberId);
  if (error) {
    logSupabaseError("admin-newsletter", "update-subscriber-status", error, {
      route: "/admin/newsletter",
      table: "newsletter_subscribers",
      userId: staff.userId,
    });
    throw new Error("Unable to update newsletter subscriber.");
  }
  revalidatePath("/admin/newsletter");
}

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
  ) => Promise<{
    data: string | null;
    error: {
      code?: string;
      message: string;
      details?: string;
      hint?: string;
    } | null;
  }>;
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
  if (!concernId)
    throw new Error("The skin concern save did not return an ID.");
  const result = await supabase
    .from("skin_concerns")
    .select("*")
    .eq("id", concernId)
    .single();
  if (result.error) throw result.error;
  return result.data as unknown as SkinConcern;
}

export async function createSkinConcernAction(
  _state: SkinConcernActionState,
  formData: FormData,
): Promise<SkinConcernActionState> {
  const staff = await requireAdmin("/admin/skin-concerns");
  const parsed = skinConcernSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the skin concern details.",
    };
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
    logSupabaseError(
      "admin-skin-concerns-create",
      "create-skin-concern",
      error,
      {
        route: "/admin/skin-concerns",
        table: "skin_concerns",
        userId: staff.userId,
      },
    );
    return {
      status: "error",
      message: messageFromSupabaseError(
        error,
        "Unable to create the skin concern.",
        { duplicate: "A skin concern with this name or slug already exists." },
      ),
    };
  }
}

export async function updateSkinConcernAction(
  concernId: string,
  _state: SkinConcernActionState,
  formData: FormData,
): Promise<SkinConcernActionState> {
  const staff = await requireAdmin("/admin/skin-concerns");
  if (!z.string().uuid().safeParse(concernId).success)
    return { status: "error", message: "Skin concern not found." };
  const parsed = skinConcernSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the skin concern details.",
    };
  const supabase = await actionClient();
  const before = await supabase
    .from("skin_concerns")
    .select("slug")
    .eq("id", concernId)
    .maybeSingle();
  if (before.error)
    return {
      status: "error",
      message: messageFromSupabaseError(
        before.error,
        "Unable to load the skin concern before saving.",
      ),
    };
  if (!before.data)
    return { status: "error", message: "Skin concern not found." };
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
    logSupabaseError(
      "admin-skin-concerns-update",
      "update-skin-concern",
      error,
      {
        route: "/admin/skin-concerns",
        table: "skin_concerns",
        userId: staff.userId,
        skinConcernId: concernId,
      },
    );
    return {
      status: "error",
      message: messageFromSupabaseError(
        error,
        "Unable to update the skin concern.",
        {
          duplicate: "A skin concern with this name or slug already exists.",
          notFound: "Skin concern not found.",
        },
      ),
    };
  }
}

export async function setSkinConcernActiveAction(
  concernId: string,
  isActive: boolean,
) {
  const staff = await requireAdmin("/admin/skin-concerns");
  if (!z.string().uuid().safeParse(concernId).success)
    throw new Error("Skin concern not found.");
  const supabase = await actionClient();
  const current = await supabase
    .from("skin_concerns")
    .select("*")
    .eq("id", concernId)
    .maybeSingle();
  if (current.error)
    throw new Error(
      messageFromSupabaseError(
        current.error,
        "Unable to load the skin concern.",
      ),
    );
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
    logSupabaseError(
      "admin-skin-concerns-status",
      "set-skin-concern-status",
      error,
      {
        route: "/admin/skin-concerns",
        table: "skin_concerns",
        userId: staff.userId,
        skinConcernId: concernId,
      },
    );
    throw new Error(
      messageFromSupabaseError(
        error,
        "Unable to update the skin concern status.",
      ),
    );
  }
}

export async function deleteSkinConcernAction(concernId: string) {
  const staff = await requireAdmin("/admin/skin-concerns");
  if (!z.string().uuid().safeParse(concernId).success)
    throw new Error("Skin concern not found.");
  const supabase = await actionClient();
  const current = await supabase
    .from("skin_concerns")
    .select("slug")
    .eq("id", concernId)
    .maybeSingle();
  if (current.error)
    throw new Error(
      messageFromSupabaseError(
        current.error,
        "Unable to load the skin concern.",
      ),
    );
  if (!current.data) throw new Error("Skin concern not found.");
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{
    error: {
      code?: string;
      message: string;
      details?: string;
      hint?: string;
    } | null;
  }>;
  const { error } = await rpc("delete_admin_skin_concern", {
    p_concern_id: concernId,
    p_actor_id: staff.userId,
  });
  if (error) {
    logSupabaseError(
      "admin-skin-concerns-delete",
      "delete-skin-concern",
      error,
      {
        route: "/admin/skin-concerns",
        table: "skin_concerns",
        userId: staff.userId,
        skinConcernId: concernId,
      },
    );
    throw new Error(
      messageFromSupabaseError(error, "Unable to delete the skin concern.", {
        invalidReference:
          "Assigned skin concerns must be deactivated instead of deleted.",
        notFound: "Skin concern not found.",
      }),
    );
  }
  revalidateSkinConcerns(String(current.data.slug));
}

export async function createProductAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/products/new");
  const parsed = productSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the product details.",
    };
  const supabase = await actionClient();
  let upload: ProductImageUpload = { url: null, cardUrl: null, thumbnailUrl: null, originalUrl: null, paths: [], originalBytes: 0, optimizedBytes: 0, width: 0, height: 0, outputWidth: 0, outputHeight: 0, durationMs: 0 };
  try {
    upload = await uploadProductImage(supabase, formData, undefined, crypto.randomUUID());
    await saveAdminProduct(supabase, {
      productId: null,
      actorId: staff.userId,
      product: buildProductPayload(parsed.data, upload),
      skinConcernIds: selectedSkinConcerns(formData),
      targetStock: parsed.data.stock_quantity,
      imageVariants: upload,
    });
  } catch (error) {
    await removeProductImages(supabase, upload.paths, {
      userId: staff.userId,
    });
    logSupabaseError("admin-products-create", "create-product-action", error, {
      route: "/admin/products/new",
      table: "products",
      userId: staff.userId,
    });
    return {
      status: "error",
      message: messageFromSupabaseError(error, "Unable to create product."),
    };
  }
  revalidateCatalog();
  redirect("/admin/products?saved=created");
}

export async function updateProductAction(
  productId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin(`/admin/products/${productId}/edit`);
  if (!z.string().uuid().safeParse(productId).success)
    return { status: "error", message: "Product not found." };
  const parsed = productSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the product details.",
    };
  const supabase = await actionClient();
  const currentResult = await supabase
    .from("products")
    .select("image_url,image_card_url,image_thumbnail_url,original_image_url")
    .eq("id", productId)
    .maybeSingle();
  if (currentResult.error) {
    logSupabaseError(
      "admin-products-edit",
      "select-current-product",
      currentResult.error,
      {
        route: `/admin/products/${productId}/edit`,
        table: "products",
        userId: staff.userId,
        productId,
      },
    );
    return {
      status: "error",
      message: messageFromSupabaseError(
        currentResult.error,
        "Unable to load the product before saving.",
      ),
    };
  }
  if (!currentResult.data)
    return { status: "error", message: "Product not found." };

  const previousImages = {
    url: typeof currentResult.data.image_url === "string" ? currentResult.data.image_url : null,
    cardUrl: typeof currentResult.data.image_card_url === "string" ? currentResult.data.image_card_url : null,
    thumbnailUrl: typeof currentResult.data.image_thumbnail_url === "string" ? currentResult.data.image_thumbnail_url : null,
    originalUrl: typeof currentResult.data.original_image_url === "string" ? currentResult.data.original_image_url : null,
  };
  let upload: ProductImageUpload = { ...previousImages, paths: [], originalBytes: 0, optimizedBytes: 0, width: 0, height: 0, outputWidth: 0, outputHeight: 0, durationMs: 0 };
  try {
    upload = await uploadProductImage(supabase, formData, previousImages, productId);
    await saveAdminProduct(supabase, {
      productId,
      actorId: staff.userId,
      product: buildProductPayload(parsed.data, upload),
      skinConcernIds: selectedSkinConcerns(formData),
      targetStock: parsed.data.stock_quantity,
      imageVariants: upload,
    });
  } catch (error) {
    await removeProductImages(supabase, upload.paths, {
      userId: staff.userId,
      productId,
    });
    logSupabaseError("admin-products-edit", "update-product-action", error, {
      route: `/admin/products/${productId}/edit`,
      table: "products",
      userId: staff.userId,
      productId,
    });
    return {
      status: "error",
      message: messageFromSupabaseError(error, "Unable to update product."),
    };
  }
  // Previous objects are intentionally retained for rollback, old links, and CDN safety.
  revalidateCatalog(productId);
  redirect("/admin/products?saved=updated");
}

export async function archiveProductAction(productId: string) {
  const staff = await requireAdmin("/admin/products");
  if (!z.string().uuid().safeParse(productId).success)
    throw new Error("Product not found.");
  const supabase = await actionClient();
  const { data, error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId)
    .select("id")
    .maybeSingle();
  if (error) {
    logSupabaseError("admin-products-archive", "archive-product", error, {
      route: "/admin/products",
      table: "products",
      userId: staff.userId,
      productId,
    });
    throw new Error(
      messageFromSupabaseError(error, "Unable to archive the product."),
    );
  }
  if (!data) throw new Error("Product not found.");
  revalidateCatalog(productId);
}

export async function createCategoryAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/categories");
  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the category details.",
    };
  const supabase = await actionClient();
  const { error } = await supabase
    .from("categories")
    .insert({
      ...parsed.data,
      slug: toSlug(parsed.data.slug || parsed.data.name),
    });
  if (error) {
    logSupabaseError("admin-category-create", "insert-category", error, {
      route: "/admin/categories",
      table: "categories",
      userId: staff.userId,
    });
    return {
      status: "error",
      message: messageFromSupabaseError(
        error,
        "Unable to create the category.",
      ),
    };
  }
  revalidateCatalog();
  return { status: "success", message: "Category created." };
}

export async function updateCategoryAction(
  categoryId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/categories");
  if (!z.string().uuid().safeParse(categoryId).success)
    return { status: "error", message: "Category not found." };
  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the category details.",
    };
  const supabase = await actionClient();
  const { data, error } = await supabase
    .from("categories")
    .update({
      ...parsed.data,
      slug: toSlug(parsed.data.slug || parsed.data.name),
    })
    .eq("id", categoryId)
    .select("id")
    .maybeSingle();
  if (error) {
    logSupabaseError("admin-category-update", "update-category", error, {
      route: "/admin/categories",
      table: "categories",
      userId: staff.userId,
      categoryId,
    });
    return {
      status: "error",
      message: messageFromSupabaseError(
        error,
        "Unable to update the category.",
      ),
    };
  }
  if (!data) return { status: "error", message: "Category not found." };
  revalidateCatalog();
  return { status: "success", message: "Category updated." };
}

export async function deleteCategoryAction(categoryId: string) {
  const staff = await requireAdmin("/admin/categories");
  if (!z.string().uuid().safeParse(categoryId).success)
    throw new Error("Category not found.");
  const supabase = await actionClient();
  const assigned = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);
  if (assigned.error) {
    logSupabaseError(
      "admin-category-delete",
      "check-category-products",
      assigned.error,
      {
        route: "/admin/categories",
        table: "products",
        userId: staff.userId,
        categoryId,
      },
    );
    throw new Error(
      messageFromSupabaseError(
        assigned.error,
        "Unable to verify whether the category is in use.",
      ),
    );
  }
  if ((assigned.count ?? 0) > 0)
    throw new Error(
      "This category is assigned to products and cannot be deleted.",
    );

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .select("id")
    .maybeSingle();
  if (error) {
    logSupabaseError("admin-category-delete", "delete-category", error, {
      route: "/admin/categories",
      table: "categories",
      userId: staff.userId,
      categoryId,
    });
    throw new Error(
      messageFromSupabaseError(error, "Unable to delete the category."),
    );
  }
  if (!data) throw new Error("Category not found.");
  revalidateCatalog();
}

export async function adjustStockAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff("/admin/inventory");
  const parsed = z
    .object({
      product_id: z.string().uuid(),
      quantity_change: z.coerce
        .number()
        .int()
        .refine((v) => v !== 0, "Enter a non-zero quantity."),
      movement_type: z.enum(["manual_adjustment", "restock"]),
    })
    .safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the stock adjustment.",
    };
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
    return {
      status: "error",
      message: messageFromSupabaseError(error, "Unable to update stock."),
    };
  }
  revalidateCatalog(parsed.data.product_id);
  return { status: "success", message: "Stock updated and movement recorded." };
}
