import { CustomerStorefront } from "@/modules/storefront/CustomerStorefront";
import { founderStory } from "@/data/founder-story";
import type { Metadata } from "next";

type StorefrontPageProps = {
  params: Promise<{ storefront?: string[] }>;
};

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { storefront = [] } = await params;
  const isAboutPage = storefront.at(-1) === "about";

  if (!isAboutPage) return {};

  return {
    title: founderStory.seo.title,
    description: founderStory.seo.description,
  };
}

export default function StorefrontPage() {
  return <CustomerStorefront />;
}
