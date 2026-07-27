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
  const isRefundPolicyPage = storefront.at(-1) === "refund-policy" || storefront.at(-1) === "return-policy";
  const isTermsPage = storefront.at(-1) === "terms-and-conditions" || storefront.at(-1) === "terms-of-service";

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
      openGraph: { title: "Privacy Policy | YARA Luxury Skincare", description: "Read YARA’s Privacy Policy to understand how personal information, orders, payments, accounts, cookies, and marketing preferences are handled.", url: `https://www.yaraproduct.com/${locale}/privacy-policy` },
      twitter: { title: "Privacy Policy | YARA Luxury Skincare", description: "Read YARA’s Privacy Policy to understand how personal information, orders, payments, accounts, cookies, and marketing preferences are handled." },
    };
  }

  if (isRefundPolicyPage) {
    const locale = storefront[0] || "en";
    return {
      title: "Returns & Refund Policy | YARA Luxury Skincare",
      description: "Read YARA's Returns & Refund Policy, including return eligibility, cosmetic hygiene restrictions, damaged products, and refund processing timelines.",
      alternates: { canonical: `/${locale}/refund-policy` },
      openGraph: { title: "Returns & Refund Policy | YARA Luxury Skincare", description: "Read YARA's Returns & Refund Policy, including return eligibility, cosmetic hygiene restrictions, damaged products, and refund processing timelines.", url: `https://www.yaraproduct.com/${locale}/refund-policy` },
      twitter: { title: "Returns & Refund Policy | YARA Luxury Skincare", description: "Read YARA's Returns & Refund Policy, including return eligibility, cosmetic hygiene restrictions, damaged products, and refund processing timelines." },
    };
  }

  if (isTermsPage) {
    const locale = storefront[0] || "en";
    return {
      title: "Terms and Conditions | YARA Luxury Skincare",
      description: "Review YARA’s Terms and Conditions covering online orders, payments, delivery, returns, customer accounts, product use, and website access.",
      alternates: { canonical: `/${locale}/terms-and-conditions` },
      openGraph: { title: "Terms and Conditions | YARA Luxury Skincare", description: "Review YARA’s Terms and Conditions covering online orders, payments, delivery, returns, customer accounts, product use, and website access.", url: `https://www.yaraproduct.com/${locale}/terms-and-conditions` },
      twitter: { title: "Terms and Conditions | YARA Luxury Skincare", description: "Review YARA’s Terms and Conditions covering online orders, payments, delivery, returns, customer accounts, product use, and website access." },
    };
  }

  return {};
}

export default function StorefrontPage() {
  return <CustomerStorefront />;
}
