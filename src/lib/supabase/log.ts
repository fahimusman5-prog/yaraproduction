import type { PostgrestError } from "@supabase/supabase-js";

type SupabaseLikeError = Partial<Pick<PostgrestError, "code" | "message" | "details" | "hint">>;

export type SupabaseLogContext = {
  route?: string;
  table?: string;
  userId?: string;
  productId?: string;
  reviewId?: string;
  categoryId?: string;
  skinConcernId?: string;
  orderId?: string;
  orderNumber?: string;
};

type SafeMessageOptions = {
  duplicate?: string;
  invalidReference?: string;
  notFound?: string;
  schemaUnavailable?: string;
};

const safeDatabaseMessages = new Set([
  "Administrator access required.",
  "Staff access required.",
  "Selected category does not exist.",
  "One or more selected skin concerns do not exist.",
  "One or more selected skin concerns are invalid.",
  "Skin concern name is required.",
  "Enter a valid skin concern slug.",
  "Sort order cannot be negative.",
  "Skin concern not found.",
  "Assigned skin concerns must be deactivated instead of deleted.",
  "Product not found.",
  "Category not found.",
  "Stock cannot be negative.",
  "Quantity change cannot be zero.",
  "Invalid movement type.",
]);

export function logSupabaseError(area: string, action: string, error: unknown, context: SupabaseLogContext = {}) {
  const supabaseError = (error ?? {}) as SupabaseLikeError;
  console.error({
    area,
    action,
    ...context,
    supabaseCode: supabaseError.code,
    message: supabaseError.message ?? (error instanceof Error ? error.message : String(error)),
    details: supabaseError.details,
    hint: supabaseError.hint,
  });
}

export function messageFromSupabaseError(error: unknown, fallback: string, options: SafeMessageOptions = {}) {
  const supabaseError = (error ?? {}) as SupabaseLikeError;
  const message = supabaseError.message ?? (error instanceof Error ? error.message : "");

  if (safeDatabaseMessages.has(message)) return message;
  if (supabaseError.code === "23505") {
    if (message.includes("products_slug_key")) return "A product with this slug already exists.";
    if (message.includes("products_sku_key")) return "A product with this SKU already exists.";
    if (message.includes("products_barcode_key")) return "A product with this barcode already exists.";
    if (message.includes("categories_slug_key")) return "A category with this slug already exists.";
    if (message.includes("categories_name_key")) return "A category with this name already exists.";
    if (message.includes("skin_concerns_slug_key")) return "A skin concern with this slug already exists.";
    if (message.includes("skin_concerns_name_key") || message.includes("skin_concerns_name_normalized_key")) return "A skin concern with this name already exists.";
    return options.duplicate ?? "A record with the same unique value already exists.";
  }
  if (supabaseError.code === "23503") {
    return options.invalidReference ?? "The selected related record is invalid or still in use.";
  }
  if (["42501", "PGRST301", "PGRST302"].includes(String(supabaseError.code))) {
    return "You do not have permission to perform this action.";
  }
  if (["42P01", "42703", "PGRST200", "PGRST205"].includes(String(supabaseError.code))) {
    return options.schemaUnavailable ?? "The required database structure is unavailable.";
  }
  if (["PGRST116", "P0002", "02000"].includes(String(supabaseError.code))) {
    return options.notFound ?? "The requested record was not found.";
  }
  return fallback;
}
