import { z } from "zod";
import { toSlug } from "./lib/format";

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
  sku: z.string().trim().min(1).max(80),
  barcode: z.string().trim().max(120).optional(),
  stock_quantity: z.coerce.number().int().min(0).max(10000000),
  low_stock_alert: z.coerce.number().int().min(0).max(1000000),
  status: z.enum(["active", "inactive", "archived"]),
  featured: z.enum(["true"]).optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(120).optional(),
  status: z.enum(["active", "inactive"]),
});

export type ProductInput = z.infer<typeof productSchema>;

export function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function selectedSkinConcerns(formData: FormData) {
  return [...new Set(
    formData
      .getAll("skin_concern_ids")
      .map(String)
      .filter((id) => z.string().uuid().safeParse(id).success),
  )];
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
