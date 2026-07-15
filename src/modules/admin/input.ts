import { z } from "zod";
import { optionalPriceFromForm } from "@/lib/pricing";
import { toSlug } from "./lib/format";

const optionalPriceSchema = z.preprocess(
  optionalPriceFromForm,
  z.coerce.number().min(0, "Original price cannot be negative.").max(999999999).nullable(),
);

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(180).optional(),
  description: z.string().trim().max(5000).default(""),
  category_id: z.string().uuid().or(z.literal("")).optional(),
  benefits: z.string().trim().max(10000).default(""),
  how_to_use: z.string().trim().max(5000).default(""),
  ingredients: z.string().trim().max(5000).default(""),
  caution: z.string().trim().max(2000).default(""),
  original_category: z.string().trim().max(160).default(""),
  image_status: z.string().trim().max(240).default(""),
  pdf_source_page: z.string().trim().max(80).default(""),
  seo_title: z.string().trim().max(180).default(""),
  seo_description: z.string().trim().max(320).default(""),
  price_lkr: z.coerce.number().min(0).max(999999999),
  price_aed: z.coerce.number().min(0).max(999999999),
  original_price_lkr: optionalPriceSchema,
  original_price_aed: optionalPriceSchema,
  sku: z.string().trim().min(1).max(80),
  barcode: z.string().trim().max(120).optional(),
  stock_quantity: z.coerce.number().int().min(0).max(10000000),
  low_stock_alert: z.coerce.number().int().min(0).max(1000000),
  status: z.enum(["active", "inactive", "archived"]),
  featured: z.enum(["true"]).optional(),
}).superRefine((input, context) => {
  if (input.original_price_lkr !== null && input.original_price_lkr < input.price_lkr) {
    context.addIssue({
      code: "custom",
      path: ["original_price_lkr"],
      message: "Sri Lanka original price must be higher than the selling price.",
    });
  }
  if (input.original_price_aed !== null && input.original_price_aed < input.price_aed) {
    context.addIssue({
      code: "custom",
      path: ["original_price_aed"],
      message: "UAE original price must be higher than the selling price.",
    });
  }
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(120).optional(),
  status: z.enum(["active", "inactive"]),
});

export const skinConcernSchema = z.object({
  name: z.string().trim().min(2, "Enter a skin concern name.").max(120),
  slug: z.string().trim().max(140).optional(),
  description: z.string().trim().max(1000).optional(),
  sort_order: z.coerce.number().int().min(0, "Sort order cannot be negative.").max(100000),
  is_active: z.enum(["true", "false"]),
});

export type ProductInput = z.infer<typeof productSchema>;

export function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function selectedSkinConcerns(formData: FormData) {
  const submitted = formData.getAll("skin_concern_ids").map(String);
  if (submitted.some((id) => !z.string().uuid().safeParse(id).success)) {
    throw new Error("One or more selected skin concerns are invalid.");
  }
  return [...new Set(submitted)];
}

export function buildProductPayload(input: ProductInput, imageUrl: string | null) {
  return {
    name: input.name,
    slug: toSlug(input.slug || input.name),
    description: input.description,
    category_id: input.category_id || null,
    image_url: imageUrl,
    price_lkr: input.price_lkr,
    price_aed: input.price_aed,
    original_price_lkr: input.original_price_lkr,
    original_price_aed: input.original_price_aed,
    sku: input.sku,
    barcode: input.barcode || null,
    low_stock_alert: input.low_stock_alert,
    status: input.status,
    benefits: input.benefits
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean),
    how_to_use: input.how_to_use,
    ingredients: input.ingredients,
    caution: input.caution,
    original_category: input.original_category,
    image_status: input.image_status,
    pdf_source_page: input.pdf_source_page,
    seo_title: input.seo_title,
    seo_description: input.seo_description,
    featured: input.featured === "true",
  };
}
