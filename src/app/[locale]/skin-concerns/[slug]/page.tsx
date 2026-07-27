import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerStorefront } from "@/modules/storefront/CustomerStorefront";
import { getActiveSkinConcernBySlug } from "@/lib/skin-concerns";
import { isLocale } from "@/lib/locales";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

// Admins can activate or deactivate concerns at any time. Resolve the current
// database state per request so a cached 404 cannot outlive that change.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const concern = await getActiveSkinConcernBySlug(slug);
  if (!concern) return {};
  const description = concern.description || `Shop YARA products selected for ${concern.name}. Available with Sri Lanka and UAE regional pricing.`;
  return {
    title: `${concern.name} Skincare | YARA`,
    description,
    alternates: {
      canonical: `https://yaraproduct.com/${locale}/skin-concerns/${concern.slug}`,
      languages: Object.fromEntries(["en", "si", "ta", "ar"].map((language) => [language, `https://yaraproduct.com/${language}/skin-concerns/${concern.slug}`])),
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !(await getActiveSkinConcernBySlug(slug))) notFound();
  return <CustomerStorefront />;
}
