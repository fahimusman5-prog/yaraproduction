import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerStorefront } from "@/modules/storefront/CustomerStorefront";
import { breadcrumbSchema, JsonLd, localizedAlternates, SITE_ORIGIN, type SeoLocale } from "@/lib/seo";
import { getActiveProductBySlug } from "@/lib/public-products";
import { isLocale } from "@/lib/locales";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getActiveProductBySlug(slug);
  if (!product) return { title: "Product not found | YARA Productions", robots: { index: false, follow: false } };
  const path = `/${locale}/product/${product.slug}`;
  const title = product.seo_title?.trim() || `${product.name} | YARA Productions`;
  const description = product.seo_description?.trim() || `${product.description} Available from YARA Productions in Sri Lanka and the UAE.`;
  return { title, description, alternates: localizedAlternates(path), openGraph: { type: "website", title, description, url: `${SITE_ORIGIN}${path}`, images: [{ url: product.image_url || `${SITE_ORIGIN}/opengraph-image`, alt: `${product.name} by YARA Productions` }] }, twitter: { card: "summary_large_image", title, description, images: [product.image_url || `${SITE_ORIGIN}/opengraph-image`] }, robots: { index: true, follow: true } };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const product = await getActiveProductBySlug(slug);
  if (!product) notFound();
  const path = `/${locale}/product/${product.slug}`;
  const productSchema = {
    "@context": "https://schema.org", "@type": "Product", name: product.name,
    image: product.image_url ? [product.image_url] : undefined, description: product.description, sku: product.sku || undefined,
    brand: { "@type": "Brand", name: "YARA Productions" }, url: `${SITE_ORIGIN}${path}`,
    offers: [
      { "@type": "Offer", price: product.price_lkr, priceCurrency: "LKR", availability: product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE_ORIGIN}${path}` },
      { "@type": "Offer", price: product.price_aed, priceCurrency: "AED", availability: product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE_ORIGIN}${path}` },
    ],
  };
  return <><JsonLd data={productSchema} /><JsonLd data={breadcrumbSchema([{ name: "Home", url: `${SITE_ORIGIN}/${locale}` }, { name: "Shop", url: `${SITE_ORIGIN}/${locale}/shop` }, ...(product.categories?.name ? [{ name: product.categories.name, url: `${SITE_ORIGIN}/${locale}/shop?category=${encodeURIComponent(product.categories.name)}` }] : []), { name: product.name, url: `${SITE_ORIGIN}${path}` }])} /><CustomerStorefront /></>;
}
