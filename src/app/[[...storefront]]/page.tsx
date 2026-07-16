import { CustomerStorefront } from "@/modules/storefront/CustomerStorefront";
import { founderStory } from "@/data/founder-story";
import { defaultLocale, isLocale, translate } from "@/i18n";
import type { Metadata } from "next";

type StorefrontPageProps = {
  params: Promise<{ storefront?: string[] }>;
};

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { storefront = [] } = await params;
  const isAboutPage = storefront.at(-1) === "about";
  const isIngredientsPage = storefront.at(-1) === "ingredients";
  const locale = isLocale(storefront[0]) ? storefront[0] : defaultLocale;

  if (isAboutPage) {
    return {
      title: founderStory.seo.title,
      description: founderStory.seo.description,
    };
  }

  if (isIngredientsPage) {
    return {
      title: translate(locale, "ingredients.seoTitle"),
      description: translate(locale, "ingredients.seoDescription"),
    };
  }

  return {};
}

export default function StorefrontPage() {
  return <CustomerStorefront />;
}
