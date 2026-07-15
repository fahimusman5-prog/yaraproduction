import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerStorefront } from "@/modules/storefront/CustomerStorefront";
import { getActiveSkinConcernBySlug } from "@/lib/skin-concerns";

type PageProps = { params: Promise<{ slug: string }> };

// Keep the canonical route in sync with admin activation changes as well.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const concern = await getActiveSkinConcernBySlug(slug);
  if (!concern) return {};
  return {
    title: `${concern.name} Skincare | YARA`,
    description: concern.description || `Shop YARA products selected for ${concern.name}.`,
    alternates: { canonical: `https://yaraproduct.com/en/skin-concerns/${concern.slug}` },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  if (!(await getActiveSkinConcernBySlug(slug))) notFound();
  return <CustomerStorefront />;
}
