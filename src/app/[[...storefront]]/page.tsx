import { CustomerStorefront } from "@/modules/storefront/CustomerStorefront";
import { founderStory } from "@/data/founder-story";
import { ingredientsSeo } from "@/data/ingredients-seo";
import type { Metadata } from "next";

type StorefrontPageProps = {
  params: Promise<{ storefront?: string[] }>;
};

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { storefront = [] } = await params;
  const isAboutPage = storefront.at(-1) === "about";
  const isIngredientsPage = storefront.at(-1) === "ingredients";
  const isPrivacyPolicyPage = storefront.at(-1) === "privacy-policy";

  if (isAboutPage) {
    return {
      title: founderStory.seo.title,
      description: founderStory.seo.description,
    };
  }

  if (isIngredientsPage) {
    return {
      title: ingredientsSeo.title,
      description: ingredientsSeo.description,
    };
  }

  if (isPrivacyPolicyPage) {
    const locale = storefront[0] || "en";
    return {
      title: "Privacy Policy | YARA Luxury Skincare",
      description: "Read YARA’s Privacy Policy to understand how personal information, orders, payments, accounts, cookies, and marketing preferences are handled.",
      alternates: { canonical: `/${locale}/privacy-policy` },
    };
  }

  return {};
}

export default function StorefrontPage() {
  return <CustomerStorefront />;
}
