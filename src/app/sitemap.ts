import type { MetadataRoute } from "next";
import { locales } from "@/lib/locales";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const baseUrl = "https://www.yaraproduct.com";

// Concern and product URLs are managed in Supabase, so the sitemap must reflect
// admin changes without waiting for the next deployment.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/shop", "/ingredients", "/about", "/contact"];
  const entries: MetadataRoute.Sitemap = locales.flatMap((locale) => staticPaths.map((path) => ({ url: `${baseUrl}/${locale}${path}`, changeFrequency: path === "" ? "weekly" : "daily", priority: path === "" ? 1 : 0.8 })));
  const supabase = await getSupabaseServerClient();
  if (!supabase) return entries;
  const [products, concerns] = await Promise.all([
    supabase.from("products").select("slug,updated_at").eq("status", "active"),
    supabase.from("skin_concerns").select("slug,updated_at").eq("is_active", true),
  ]);
  if (!products.error) {
    for (const product of products.data ?? []) for (const locale of locales) entries.push({ url: `${baseUrl}/${locale}/product/${product.slug}`, lastModified: product.updated_at, changeFrequency: "weekly", priority: 0.7 });
  }
  if (!concerns.error) {
    for (const concern of concerns.data ?? []) for (const locale of locales) entries.push({ url: `${baseUrl}/${locale}/skin-concerns/${concern.slug}`, lastModified: concern.updated_at, changeFrequency: "weekly", priority: 0.7 });
  }
  return entries;
}
